-- Descripción automática de conciertos.
--
-- 206 de 220 fichas no tenían descripción: para Google eran páginas delgadas
-- (fecha, lugar y botón). Esta migración genera un texto en español a partir
-- de los datos que ya existen (artista, venue, ciudad, país, fecha, promotora,
-- géneros curados, precios) cuando la descripción llega vacía, y lo mantiene
-- al día mientras nadie lo haya editado a mano.
--
-- description_is_auto = true  → texto generado; se regenera si cambian fecha,
--                                artista, venue, promotora o título.
-- description_is_auto = false → texto escrito por un editor; no se toca.
-- Vaciar la descripción desde el admin vuelve a activar la generación.

alter table public.concerts
  add column if not exists description_is_auto boolean not null default false;

create or replace function public.build_concert_description(
  p_title text,
  p_date date,
  p_artist_id uuid,
  p_venue_id uuid,
  p_promoter_id uuid,
  p_has_prices boolean,
  p_has_ticket_url boolean
)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  dias   constant text[] := array['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  meses  constant text[] := array['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  v_artist    text;
  v_genres    text[];
  v_venue     text;
  v_capacity  integer;
  v_city      text;
  v_country   text;
  v_promoter  text;
  v_main      text[];
  v_when      text;
  v_where     text;
  v_past      boolean;
  v_genre_txt text;
  v_s1 text; v_s2 text; v_s3 text; v_s4 text;
begin
  select a.name, a.genres into v_artist, v_genres
  from public.artists a where a.id = p_artist_id;

  select v.name, v.capacity, c.name, co.name
    into v_venue, v_capacity, v_city, v_country
  from public.venues v
  left join public.cities c on c.id = v.city_id
  left join public.countries co on co.id = c.country_id
  where v.id = p_venue_id;

  select p.name into v_promoter from public.promoters p where p.id = p_promoter_id;

  v_artist := coalesce(nullif(btrim(v_artist), ''), nullif(btrim(p_title), ''));
  if v_artist is null then
    return null;
  end if;

  v_past := p_date is not null and p_date < current_date;

  v_when := case
    when p_date is null then 'en fecha por confirmar'
    else format('el %s %s de %s de %s',
      dias[extract(dow from p_date)::int + 1],
      extract(day from p_date)::int,
      meses[extract(month from p_date)::int],
      extract(year from p_date)::int)
  end;

  -- "Movistar Arena, Bogotá (Colombia)" — sin artículo delante del venue para no
  -- equivocar el género (el Estadio / la Arena).
  v_where := concat_ws(', ', v_venue, v_city);
  if v_country is not null and v_where is not null then
    v_where := v_where || format(' (%s)', v_country);
  end if;
  v_where := coalesce(v_where, 'América Latina');

  -- Géneros curados en español (genre_mappings), máximo dos.
  select array_agg(distinct gm.main_genre order by gm.main_genre)
    into v_main
  from unnest(coalesce(v_genres, '{}'::text[])) g
  join public.genre_mappings gm on lower(gm.spotify_genre) = lower(g);
  if v_main is not null then
    v_main := v_main[1:2];
    v_genre_txt := array_to_string(v_main, ' y ');
  end if;

  -- Frase 1: quién, dónde y cuándo.
  v_s1 := format('%s %s en %s %s.',
    v_artist,
    case when v_past then 'se presentó' else 'se presenta' end,
    v_where,
    v_when);

  -- Si el título aporta algo distinto del nombre del artista, se menciona.
  if p_title is not null
     and lower(btrim(p_title)) <> lower(v_artist)
     and position(lower(v_artist) in lower(p_title)) = 0 then
    v_s1 := v_s1 || format(' El show hace parte de «%s».', btrim(p_title));
  end if;

  -- Frase 2: género y aforo.
  v_s2 := case
    when v_genre_txt is not null and v_capacity > 0 then
      format(' Una noche de %s en un recinto con capacidad para %s personas.',
        lower(v_genre_txt), replace(to_char(v_capacity, 'FM999G999G999'), ',', '.'))
    when v_genre_txt is not null then
      format(' Una noche de %s para sus fans en %s.', lower(v_genre_txt), coalesce(v_country, 'América Latina'))
    when v_capacity > 0 then
      format(' %s tiene capacidad para %s personas.', coalesce(v_venue, 'El recinto'), replace(to_char(v_capacity, 'FM999G999G999'), ',', '.'))
    else ''
  end;

  -- Frase 3: promotora.
  v_s3 := case when v_promoter is not null then format(' El evento es producido por %s.', v_promoter) else '' end;

  -- Frase 4: qué encuentra el lector en la ficha.
  v_s4 := case
    when v_past then
      format(' Aquí encontrarás los detalles del show%s y el setlist reportado por los asistentes.',
        case when p_has_prices then ', los precios que tuvo la boletería' else '' end)
    else
      format(' Aquí encontrarás la fecha confirmada, el lugar%s%s, y el setlist cuando termine el show.',
        case when p_has_prices then ', los precios de entradas por localidad' else '' end,
        case when p_has_ticket_url then ' y el enlace oficial de venta' else '' end)
  end;

  return v_s1 || v_s2 || v_s3 || v_s4;
end;
$$;

create or replace function public.concerts_auto_description()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_empty boolean := nullif(btrim(new.description), '') is null;
  v_related_changed boolean := false;
begin
  if tg_op = 'UPDATE' then
    -- Un editor escribió (o cambió) el texto: queda como manual.
    if not v_empty and new.description is distinct from old.description then
      new.description_is_auto := false;
      return new;
    end if;

    v_related_changed :=
         new.date        is distinct from old.date
      or new.artist_id   is distinct from old.artist_id
      or new.venue_id    is distinct from old.venue_id
      or new.promoter_id is distinct from old.promoter_id
      or new.title       is distinct from old.title
      or (nullif(btrim(new.ticket_prices_html), '') is null) is distinct from (nullif(btrim(old.ticket_prices_html), '') is null)
      or (new.ticket_url is null) is distinct from (old.ticket_url is null);
  end if;

  if v_empty or (tg_op = 'UPDATE' and old.description_is_auto and v_related_changed) then
    new.description := public.build_concert_description(
      new.title,
      new.date,
      new.artist_id,
      new.venue_id,
      new.promoter_id,
      nullif(btrim(new.ticket_prices_html), '') is not null,
      new.ticket_url is not null
    );
    new.description_is_auto := new.description is not null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_concerts_auto_description on public.concerts;
create trigger trg_concerts_auto_description
  before insert or update on public.concerts
  for each row execute function public.concerts_auto_description();

-- Relleno de las fichas vacías. updated_at avanza para que el sitemap anuncie
-- el cambio y Google vuelva a rastrearlas.
update public.concerts
set description = null,
    updated_at = now()
where nullif(btrim(description), '') is null;

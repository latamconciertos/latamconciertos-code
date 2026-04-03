import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol
        className="flex items-baseline gap-2 text-sm text-muted-foreground"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="flex items-baseline gap-2"
        >
          <Link
            to="/"
            className="hover:text-foreground transition-colors flex items-baseline gap-1 leading-none"
            itemProp="item"
          >
            <Home className="h-3.5 w-3.5" />
            <span itemProp="name" className="leading-none">Inicio</span>
          </Link>
          <meta itemProp="position" content="1" />
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const position = index + 2;

          return (
            <li
              key={index}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="flex items-baseline gap-2"
            >
              {item.href && !isLast ? (
                <>
                  <Link
                    to={item.href}
                    className="hover:text-foreground transition-colors leading-none"
                    itemProp="item"
                  >
                    <span itemProp="name" className="leading-none">{item.label}</span>
                  </Link>
                  <meta itemProp="position" content={position.toString()} />
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                </>
              ) : (
                <>
                  <span
                    className={`leading-none ${isLast ? 'text-foreground font-medium' : ''}`}
                    itemProp="name"
                  >
                    {item.label}
                  </span>
                  <meta itemProp="position" content={position.toString()} />
                  {!isLast && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { IndividualDailyResult } from "@/components/tournaments/types";
import LoadingState from "@/components/tournaments/results/LoadingState";
import BackButton from "@/components/tournaments/results/BackButton";
import TournamentHeader from "@/components/tournaments/results/TournamentHeader";
import ResultsTabs from "@/components/tournaments/results/ResultsTabs";
import Navigation from "@/components/Navigation";

const PublicTournamentResults = () => {
  const { id } = useParams();

  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      console.log("🎳 Fetching tournament details for ID:", id);
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Error fetching tournament:", error);
        throw error;
      }

      console.log("✅ Tournament data:", data);
      return data;
    },
  });

  const { data: individualResults = [], isLoading: isLoadingIndividualResults } = useQuery<IndividualDailyResult[]>({
    queryKey: ["tournament-individual-results", id, "Individual"],
    queryFn: async () => {
      console.log("🎳 Fetching individual results for tournament:", id);
      const { data, error } = await supabase
        .rpc('get_individual_daily_results', { 
          tournament_id_param: id,
          modality_name_param: 'Individual'
        });

      if (error) {
        console.error("❌ Error fetching individual results:", error);
        throw error;
      }

      console.log("✅ Individual results:", data);
      return data.map((result: any) => ({
        ...result,
        modality_id: result.modality_id || null
      })) as IndividualDailyResult[];
    },
    enabled: !!id,
  });

  const { data: doublesResults = [], isLoading: isLoadingDoublesResults } = useQuery<IndividualDailyResult[]>({
    queryKey: ["tournament-doubles-results", id, "Dobles"],
    queryFn: async () => {
      console.log("🎳 Fetching doubles results for tournament:", id);
      const { data, error } = await supabase
        .rpc('get_individual_daily_results', { 
          tournament_id_param: id,
          modality_name_param: 'Dobles'
        });

      if (error) {
        console.error("❌ Error fetching doubles results:", error);
        throw error;
      }

      console.log("✅ Doubles results:", data);
      return data.map((result: any) => ({
        ...result,
        modality_id: result.modality_id || null
      })) as IndividualDailyResult[];
    },
    enabled: !!id,
  });

  const { data: ternasResults = [], isLoading: isLoadingTernasResults } = useQuery<IndividualDailyResult[]>({
    queryKey: ["tournament-ternas-results", id, "Ternas"],
    queryFn: async () => {
      console.log("🎳 Fetching ternas results for tournament:", id);
      const { data, error } = await supabase
        .rpc('get_individual_daily_results', { 
          tournament_id_param: id,
          modality_name_param: 'Ternas'
        });

      if (error) {
        console.error("❌ Error fetching ternas results:", error);
        throw error;
      }

      console.log("✅ Ternas results:", data);
      return data.map((result: any) => ({
        ...result,
        modality_id: result.modality_id || null
      })) as IndividualDailyResult[];
    },
    enabled: !!id,
  });

  const { data: teamsResults = [], isLoading: isLoadingTeamsResults } = useQuery<IndividualDailyResult[]>({
    queryKey: ["tournament-teams-results", id, "Equipos"],
    queryFn: async () => {
      console.log("🎳 Fetching teams results for tournament:", id);
      const { data, error } = await supabase
        .rpc('get_individual_daily_results', { 
          tournament_id_param: id,
          modality_name_param: 'Equipos'
        });

      if (error) {
        console.error("❌ Error fetching teams results:", error);
        throw error;
      }

      console.log("✅ Teams results:", data);
      return data.map((result: any) => ({
        ...result,
        modality_id: result.modality_id || null
      })) as IndividualDailyResult[];
    },
    enabled: !!id,
  });

  if (isLoadingTournament || isLoadingIndividualResults || isLoadingDoublesResults || isLoadingTernasResults || isLoadingTeamsResults) {
    return <LoadingState />;
  }

  return (
    <div className="page-content">
      <Navigation />
      <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 pt-24">
        <BackButton />
        <div className="space-y-6">
          <TournamentHeader name={tournament?.name} />
          <Card className="bg-white/50 dark:bg-white/[0.04] backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <ResultsTabs
                individualResults={individualResults}
                doublesResults={doublesResults}
                ternasResults={ternasResults}
                teamsResults={teamsResults}
                linesPerDay={tournament?.lines_per_day || 0}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicTournamentResults;
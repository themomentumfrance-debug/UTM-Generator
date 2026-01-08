import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link2, BarChart3, LogOut, Loader2, Sparkles, PieChart, Shield } from "lucide-react";
import UtmForm from "@/components/UtmForm";
import UtmLinksList from "@/components/UtmLinksList";
import AISuggestionsPanel from "@/components/AISuggestionsPanel";
import GoogleDriveExport from "@/components/GoogleDriveExport";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  const seedData = trpc.seed.initializeDefaults.useMutation({
    onSuccess: () => {
      toast.success("Données par défaut initialisées");
      utils.socials.list.invalidate();
      utils.contentTypes.list.invalidate();
      utils.objectives.list.invalidate();
      utils.audiences.list.invalidate();
    },
  });

  // Initialize default data on first load
  useEffect(() => {
    if (isAuthenticated) {
      seedData.mutate();
    }
  }, [isAuthenticated]);

  const handleUtmCreated = () => {
    utils.utmLinks.list.invalidate();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="container py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm font-medium mb-6 border border-slate-200">
              <Link2 className="h-4 w-4" />
              Outil de marketing digital
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-800">
              Générateur de{" "}
              <span className="text-slate-600">Liens UTM</span>
            </h1>
            
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
              Créez, gérez et suivez vos liens UTM pour vos campagnes marketing sur les réseaux sociaux. 
              Analysez vos performances et optimisez vos stratégies avec l'aide de l'IA.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-slate-800 hover:bg-slate-900 text-white">
                <a href={getLoginUrl()}>
                  <Link2 className="h-5 w-5 mr-2" />
                  Commencer maintenant
                </a>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <Link2 className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="font-semibold mb-2 text-slate-800">Génération automatique</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Créez des liens UTM structurés en quelques clics avec des paramètres pré-remplis intelligemment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="font-semibold mb-2 text-slate-800">Suivi centralisé</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Visualisez tous vos liens UTM en un seul endroit avec les informations marketing associées.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="font-semibold mb-2 text-slate-800">Suggestions IA</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Obtenez des recommandations d'angles marketing et de hooks basées sur vos objectifs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-800">UTM Generator</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
              {user?.role === 'admin' && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-slate-800">Tableau de bord</h1>
          <p className="text-slate-500">
            Créez et gérez vos liens UTM pour vos campagnes marketing
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="gap-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-slate-700"
              onClick={() => setIsAIPanelOpen(true)}
            >
              <Sparkles className="h-4 w-4 text-slate-500" />
              Assistant IA Marketing
            </Button>
            <GoogleDriveExport />
          </div>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3 bg-slate-100 p-1">
            <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm">
              <Link2 className="h-4 w-4" />
              Créer un lien
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              Mes liens
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm">
              <PieChart className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <UtmForm onSuccess={handleUtmCreated} />
          </TabsContent>

          <TabsContent value="list">
            <UtmLinksList />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-auto bg-white">
        <div className="container text-center text-sm text-slate-500">
          <p>UTM Generator — Outil de gestion de liens marketing</p>
        </div>
      </footer>

      {/* AI Suggestions Panel - Persistent floating panel */}
      <AISuggestionsPanel 
        isOpen={isAIPanelOpen} 
        onClose={() => setIsAIPanelOpen(false)} 
      />
    </div>
  );
}

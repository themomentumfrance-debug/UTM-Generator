import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link2, TrendingUp, Target, Share2, BarChart3, Filter, X, MousePointer, Globe, Monitor, Users, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Palette professionnelle slate
const COLORS = [
  "#1e293b", // slate-800
  "#334155", // slate-700
  "#475569", // slate-600
  "#64748b", // slate-500
  "#94a3b8", // slate-400
  "#cbd5e1", // slate-300
  "#e2e8f0", // slate-200
  "#f1f5f9", // slate-100
];

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { data: utmLinks = [], isLoading } = trpc.utmLinks.list.useQuery();
  const { data: socials = [] } = trpc.socials.list.useQuery();
  const { data: contentTypes = [] } = trpc.contentTypes.list.useQuery();
  const { data: objectives = [] } = trpc.objectives.list.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery(undefined, { enabled: isAdmin });
  const { data: globalClickStats } = trpc.clicks.getGlobalStats.useQuery();

  // Filtres
  const [filterSocial, setFilterSocial] = useState<string>("all");
  const [filterContentType, setFilterContentType] = useState<string>("all");
  const [filterObjective, setFilterObjective] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  const hasActiveFilters = filterSocial !== "all" || filterContentType !== "all" || filterObjective !== "all" || filterUser !== "all";

  const clearFilters = () => {
    setFilterSocial("all");
    setFilterContentType("all");
    setFilterObjective("all");
    setFilterUser("all");
  };

  // Filtrer les liens selon les filtres actifs
  const filteredLinks = useMemo(() => {
    return utmLinks.filter(link => {
      const matchesSocial = filterSocial === "all" || link.socialId.toString() === filterSocial;
      const matchesContentType = filterContentType === "all" || link.contentTypeId.toString() === filterContentType;
      const matchesObjective = filterObjective === "all" || link.objectifId.toString() === filterObjective;
      const matchesUser = filterUser === "all" || link.userId?.toString() === filterUser;
      return matchesSocial && matchesContentType && matchesObjective && matchesUser;
    });
  }, [utmLinks, filterSocial, filterContentType, filterObjective, filterUser]);

  // Statistiques par réseau social
  const socialStats = useMemo(() => {
    const counts: Record<number, { links: number; clicks: number }> = {};
    filteredLinks.forEach((link) => {
      if (link.socialId) {
        if (!counts[link.socialId]) counts[link.socialId] = { links: 0, clicks: 0 };
        counts[link.socialId].links++;
        counts[link.socialId].clicks += link.clickCount || 0;
      }
    });
    return socials
      .map((social) => ({
        name: social.nom,
        liens: counts[social.id]?.links || 0,
        clics: counts[social.id]?.clicks || 0,
      }))
      .filter((item) => item.liens > 0)
      .sort((a, b) => b.clics - a.clics);
  }, [filteredLinks, socials]);

  // Statistiques par type de contenu
  const contentTypeStats = useMemo(() => {
    const counts: Record<number, { links: number; clicks: number }> = {};
    filteredLinks.forEach((link) => {
      if (link.contentTypeId) {
        if (!counts[link.contentTypeId]) counts[link.contentTypeId] = { links: 0, clicks: 0 };
        counts[link.contentTypeId].links++;
        counts[link.contentTypeId].clicks += link.clickCount || 0;
      }
    });
    return contentTypes
      .map((ct) => ({
        name: ct.nom,
        liens: counts[ct.id]?.links || 0,
        clics: counts[ct.id]?.clicks || 0,
      }))
      .filter((item) => item.liens > 0)
      .sort((a, b) => b.clics - a.clics);
  }, [filteredLinks, contentTypes]);

  // Statistiques par objectif
  const objectiveStats = useMemo(() => {
    const counts: Record<number, { links: number; clicks: number }> = {};
    filteredLinks.forEach((link) => {
      if (link.objectifId) {
        if (!counts[link.objectifId]) counts[link.objectifId] = { links: 0, clicks: 0 };
        counts[link.objectifId].links++;
        counts[link.objectifId].clicks += link.clickCount || 0;
      }
    });
    return objectives
      .map((obj) => ({
        name: obj.nom,
        liens: counts[obj.id]?.links || 0,
        clics: counts[obj.id]?.clicks || 0,
      }))
      .filter((item) => item.liens > 0)
      .sort((a, b) => b.clics - a.clics);
  }, [filteredLinks, objectives]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    const totalClicks = filteredLinks.reduce((sum, link) => sum + (link.clickCount || 0), 0);
    const uniqueSocials = new Set(filteredLinks.map((l) => l.socialId).filter(Boolean)).size;
    const uniqueContentTypes = new Set(filteredLinks.map((l) => l.contentTypeId).filter(Boolean)).size;
    const uniqueObjectives = new Set(filteredLinks.map((l) => l.objectifId).filter(Boolean)).size;
    
    return {
      totalLinks: filteredLinks.length,
      totalClicks,
      uniqueSocials,
      uniqueContentTypes,
      uniqueObjectives,
    };
  }, [filteredLinks]);

  // Top 10 liens par clics
  const topLinksByClicks = useMemo(() => {
    return [...filteredLinks]
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 10)
      .map(link => ({
        name: link.utmCampaign?.substring(0, 30) || link.slug || 'N/A',
        clics: link.clickCount || 0,
        social: socials.find(s => s.id === link.socialId)?.nom || 'N/A',
      }));
  }, [filteredLinks, socials]);

  // Préparer les données de clics par pays
  const clicksByCountry = useMemo(() => {
    if (!globalClickStats?.byCountry) return [];
    return Object.entries(globalClickStats.byCountry)
      .map(([country, count]) => ({ name: country, value: count as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [globalClickStats]);

  // Préparer les données de clics par appareil
  const clicksByDevice = useMemo(() => {
    if (!globalClickStats?.byDevice) return [];
    return Object.entries(globalClickStats.byDevice)
      .map(([device, count]) => ({ name: device, value: count as number }))
      .sort((a, b) => b.value - a.value);
  }, [globalClickStats]);

  // Préparer les données de clics par navigateur
  const clicksByBrowser = useMemo(() => {
    if (!globalClickStats?.byBrowser) return [];
    return Object.entries(globalClickStats.byBrowser)
      .map(([browser, count]) => ({ name: browser, value: count as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [globalClickStats]);

  // Préparer les données de clics par jour
  const clicksByDay = useMemo(() => {
    if (!globalClickStats?.byDay) return [];
    return Object.entries(globalClickStats.byDay)
      .map(([date, count]) => ({ 
        date: format(new Date(date), 'dd/MM', { locale: fr }), 
        clics: count as number 
      }));
  }, [globalClickStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (utmLinks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Aucune donnée à afficher pour le moment.
            <br />
            Créez des liens UTM pour voir les statistiques.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Filter className="h-4 w-4" />
              Filtrer:
            </div>
            <div className="flex flex-wrap gap-3 flex-1">
              {/* Filtre par utilisateur (admin only) */}
              {isAdmin && users.length > 0 && (
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name || u.email || `User #${u.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={filterSocial} onValueChange={setFilterSocial}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Réseau social" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les réseaux</SelectItem>
                  {socials?.map((social) => (
                    <SelectItem key={social.id} value={social.id.toString()}>
                      {social.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterContentType} onValueChange={setFilterContentType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type de contenu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {contentTypes?.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id.toString()}>
                      {ct.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterObjective} onValueChange={setFilterObjective}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Objectif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les objectifs</SelectItem>
                  {objectives?.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id.toString()}>
                      {obj.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                  <X className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <p className="text-sm text-slate-500 mt-3">
              Affichage de {filteredLinks.length} lien(s) sur {utmLinks.length} total
            </p>
          )}
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Link2 className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{globalStats.totalLinks}</p>
                <p className="text-sm text-slate-500">Liens créés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MousePointer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{globalStats.totalClicks}</p>
                <p className="text-sm text-slate-500">Clics totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Share2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{globalStats.uniqueSocials}</p>
                <p className="text-sm text-slate-500">Réseaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{globalStats.uniqueContentTypes}</p>
                <p className="text-sm text-slate-500">Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{globalStats.uniqueObjectives}</p>
                <p className="text-sm text-slate-500">Objectifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de statistiques */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="clicks">Clics</TabsTrigger>
          <TabsTrigger value="geography">Géographie</TabsTrigger>
          <TabsTrigger value="devices">Appareils</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top liens par clics */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Top 10 liens par clics</CardTitle>
                <CardDescription>Les liens les plus performants</CardDescription>
              </CardHeader>
              <CardContent>
                {topLinksByClicks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topLinksByClicks} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value} clics`, 'Clics']}
                      />
                      <Bar dataKey="clics" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucun clic enregistré</p>
                )}
              </CardContent>
            </Card>

            {/* Répartition par réseau social */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Clics par réseau social</CardTitle>
                <CardDescription>Performance par plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                {socialStats.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={Math.max(200, socialStats.length * 45)}>
                      <BarChart data={socialStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100} 
                          stroke="#64748b" 
                          fontSize={12}
                          tick={{ fill: '#475569' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value} clics`, 'Clics']}
                        />
                        <Bar dataKey="clics" fill="#475569" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Liste détaillée en dessous */}
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      {socialStats.map((stat, index) => (
                        <div key={stat.name} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-slate-200 text-slate-600">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-700">{stat.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">{stat.liens} liens</span>
                            <span className="text-sm font-bold text-slate-800">{stat.clics} clics</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Répartition par objectif et type de contenu */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Par objectif</CardTitle>
              </CardHeader>
              <CardContent>
                {objectiveStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={objectiveStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="liens" fill="#94a3b8" name="Liens" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clics" fill="#3b82f6" name="Clics" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Par type de contenu</CardTitle>
              </CardHeader>
              <CardContent>
                {contentTypeStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={contentTypeStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="liens" fill="#94a3b8" name="Liens" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clics" fill="#10b981" name="Clics" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Clics */}
        <TabsContent value="clicks" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Évolution des clics (7 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clicksByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={clicksByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value} clics`, 'Clics']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clics" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#1d4ed8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-8">Aucun clic enregistré</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Géographie */}
        <TabsContent value="geography" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Clics par pays
              </CardTitle>
              <CardDescription>Répartition géographique des clics</CardDescription>
            </CardHeader>
            <CardContent>
              {clicksByCountry.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clicksByCountry} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis dataKey="name" type="category" width={100} stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value} clics`, 'Clics']}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700 mb-3">Détail par pays</h4>
                    {clicksByCountry.map((country, index) => (
                      <div key={country.name} className="flex items-center justify-between py-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-slate-100 text-slate-600">
                            {index + 1}
                          </span>
                          <span className="text-slate-700">{country.name}</span>
                        </div>
                        <span className="font-medium text-slate-800">{country.value} clics</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Aucune donnée géographique disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Appareils */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Par type d'appareil
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clicksByDevice.length > 0 ? (
                  <div className="space-y-4">
                    {clicksByDevice.map((device, index) => {
                      const total = clicksByDevice.reduce((sum, d) => sum + d.value, 0);
                      const percentage = total > 0 ? (device.value / total) * 100 : 0;
                      return (
                        <div key={device.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{device.name}</span>
                            <span className="text-sm font-bold text-slate-800">{device.value} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full transition-all" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Par navigateur</CardTitle>
              </CardHeader>
              <CardContent>
                {clicksByBrowser.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={clicksByBrowser}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value} clics`, 'Clics']}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MousePointer, Globe, Smartphone, Monitor, Tablet, Chrome, Clock, TrendingUp, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

// Palette de couleurs professionnelle
const COLORS = ["#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

interface StatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  utmLinkId: number;
  linkName?: string;
}

export default function StatsDialog({ open, onOpenChange, utmLinkId, linkName }: StatsDialogProps) {
  const { data: stats, isLoading } = trpc.clicks.getStats.useQuery(
    { utmLinkId },
    { enabled: open && utmLinkId > 0 }
  );

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getDeviceLabel = (device: string) => {
    switch (device?.toLowerCase()) {
      case "mobile":
        return "Mobile";
      case "tablet":
        return "Tablette";
      case "desktop":
        return "Ordinateur";
      default:
        return device || "Inconnu";
    }
  };

  // Préparer les données pour les graphiques
  const countryData = stats?.byCountry 
    ? Object.entries(stats.byCountry)
        .map(([name, value]) => ({ name: name || "Inconnu", value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  const deviceData = stats?.byDevice
    ? Object.entries(stats.byDevice).map(([name, value]) => ({ 
        name: getDeviceLabel(name), 
        value,
        originalName: name
      }))
    : [];

  const browserData = stats?.byBrowser
    ? Object.entries(stats.byBrowser)
        .map(([name, value]) => ({ name: name || "Inconnu", value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    : [];

  const timelineData = stats?.byDay
    ? Object.entries(stats.byDay).map(([date, value]) => ({
        date: format(new Date(date), "dd/MM", { locale: fr }),
        clics: value,
      }))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-slate-200">
        <DialogHeader className="text-center pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center justify-center gap-2 text-slate-800">
            <MousePointer className="h-5 w-5 text-slate-600" />
            Statistiques de clics
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-center">
            {linkName ? `Statistiques pour: ${linkName}` : "Détails des clics sur ce lien"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
          </div>
        ) : !stats || stats.totalClicks === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <MousePointer className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">Aucun clic enregistré pour ce lien</p>
            <p className="text-sm mt-1">Les statistiques apparaîtront dès que le lien sera cliqué</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-800">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="geography" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-800">Géographie</TabsTrigger>
              <TabsTrigger value="devices" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-800">Appareils</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-800">Chronologie</TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              {/* Statistiques principales - centrées */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <MousePointer className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{stats.totalClicks}</p>
                        <p className="text-xs text-slate-500">Clics totaux</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Globe className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{Object.keys(stats.byCountry || {}).length}</p>
                        <p className="text-xs text-slate-500">Pays</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Smartphone className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{Object.keys(stats.byDevice || {}).length}</p>
                        <p className="text-xs text-slate-500">Appareils</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="pt-4 pb-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Chrome className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{Object.keys(stats.byBrowser || {}).length}</p>
                        <p className="text-xs text-slate-500">Navigateurs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Répartition par type d'appareil */}
              {deviceData.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-center gap-2 text-slate-700">
                      <Smartphone className="h-4 w-4" />
                      Répartition par type d'appareil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap justify-center gap-4">
                      {deviceData.map((device) => (
                        <div key={device.name} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 min-w-[140px]">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            {getDeviceIcon(device.originalName)}
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-xl text-slate-800">{device.value}</p>
                            <p className="text-sm text-slate-500">{device.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top 5 pays - graphique en barres horizontales */}
              {countryData.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-center gap-2 text-slate-700">
                      <MapPin className="h-4 w-4" />
                      Top 5 pays
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={countryData.slice(0, 5)} layout="vertical" margin={{ left: 20, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#64748b" fontSize={12} />
                          <YAxis dataKey="name" type="category" width={80} stroke="#64748b" fontSize={12} tick={{ fill: '#475569' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number) => [`${value} clics`, 'Clics']}
                          />
                          <Bar dataKey="value" fill="#475569" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Derniers clics */}
              {stats.recentClicks && stats.recentClicks.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-center gap-2 text-slate-700">
                      <Clock className="h-4 w-4" />
                      Derniers clics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {stats.recentClicks.slice(0, 10).map((click, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 border-b border-slate-100 last:border-0 bg-slate-50 rounded">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="p-1.5 bg-white rounded border border-slate-200">
                              {getDeviceIcon(click.deviceType || '')}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{click.country || "Inconnu"}</span>
                            <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-600">
                              {getDeviceLabel(click.deviceType || '')}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                              {click.browser || "Inconnu"}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                            {format(new Date(click.clickedAt), "dd/MM HH:mm", { locale: fr })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Géographie */}
            <TabsContent value="geography" className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-center gap-2 text-slate-700">
                    <Globe className="h-4 w-4" />
                    Répartition par pays
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {countryData.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Graphique en barres (plus lisible que le pie chart) */}
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={countryData} layout="vertical" margin={{ left: 10, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" fontSize={11} />
                            <YAxis dataKey="name" type="category" width={70} stroke="#64748b" fontSize={11} tick={{ fill: '#475569' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                              }}
                              formatter={(value: number) => [`${value} clics`, 'Clics']}
                            />
                            <Bar dataKey="value" fill="#475569" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Liste détaillée */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        <h4 className="font-medium text-slate-700 text-center mb-3">Détail par pays</h4>
                        {countryData.map((country, index) => (
                          <div key={country.name} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-slate-200 text-slate-600">
                                {index + 1}
                              </span>
                              <span className="text-sm text-slate-700">{country.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-800">{country.value}</span>
                              <span className="text-xs text-slate-500">
                                ({((country.value / stats.totalClicks) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">
                      Aucune donnée géographique disponible
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appareils */}
            <TabsContent value="devices" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Par type d'appareil */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-center gap-2 text-slate-700">
                      <Smartphone className="h-4 w-4" />
                      Par type d'appareil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deviceData.length > 0 ? (
                      <div className="space-y-4">
                        {/* Liste avec barres de progression */}
                        {deviceData.map((device, index) => {
                          const percentage = (device.value / stats.totalClicks) * 100;
                          return (
                            <div key={device.name} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-slate-100 rounded">
                                    {getDeviceIcon(device.originalName)}
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">{device.name}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{device.value} ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all" 
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

                {/* Par navigateur */}
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-center gap-2 text-slate-700">
                      <Chrome className="h-4 w-4" />
                      Par navigateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {browserData.length > 0 ? (
                      <div className="space-y-4">
                        {browserData.map((browser, index) => {
                          const percentage = (browser.value / stats.totalClicks) * 100;
                          return (
                            <div key={browser.name} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="text-sm font-medium text-slate-700">{browser.name}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{browser.value} ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all" 
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
              </div>
            </TabsContent>

            {/* Chronologie */}
            <TabsContent value="timeline" className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-center gap-2 text-slate-700">
                    <TrendingUp className="h-4 w-4" />
                    Évolution des clics (7 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timelineData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineData} margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tick={{ fill: '#475569' }} />
                          <YAxis stroke="#64748b" fontSize={12} tick={{ fill: '#475569' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`${value} clics`, 'Clics']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="clics" 
                            stroke="#475569" 
                            strokeWidth={2}
                            dot={{ fill: "#475569", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: "#334155" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">
                      Aucune donnée chronologique disponible
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

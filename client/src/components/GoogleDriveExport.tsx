import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function GoogleDriveExport() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [exportStatus, setExportStatus] = useState<{
    socials: "pending" | "success" | "error";
    contentTypes: "pending" | "success" | "error";
    objectives: "pending" | "success" | "error";
    channels: "pending" | "success" | "error";
    utmLinks: "pending" | "success" | "error";
  } | null>(null);

  const { data: utmLinks } = trpc.utmLinks.list.useQuery();
  const { data: socials } = trpc.socials.list.useQuery();
  const { data: contentTypes } = trpc.contentTypes.list.useQuery();
  const { data: objectives } = trpc.objectives.list.useQuery();
  const { data: channels } = trpc.channels.list.useQuery();
  const { data: users } = trpc.users.list.useQuery(undefined, { enabled: isAdmin });

  const generateCSV = (data: Record<string, unknown>[], headers: string[]): string => {
    const csvRows = [headers.join(",")];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(","));
    }
    
    return csvRows.join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Fonction pour obtenir le nom d'un utilisateur par son ID
  const getUserInfo = (userId: number | null | undefined) => {
    if (!userId || !users) return { userName: "N/A", userEmail: "N/A" };
    const foundUser = users.find(u => u.id === userId);
    return {
      userName: foundUser?.name || "N/A",
      userEmail: foundUser?.email || "N/A"
    };
  };

  // Filtrer les liens selon l'utilisateur sélectionné (admin only)
  const getFilteredLinks = () => {
    if (!utmLinks) return [];
    if (!isAdmin || filterUserId === "all") return utmLinks;
    return utmLinks.filter(link => link.userId?.toString() === filterUserId);
  };

  const handleExportAll = async () => {
    setExporting(true);
    setExportStatus({
      socials: "pending",
      contentTypes: "pending",
      objectives: "pending",
      channels: "pending",
      utmLinks: "pending",
    });

    try {
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const filteredLinks = getFilteredLinks();

      // Export Socials
      if (socials) {
        const csv = generateCSV(
          socials.map(s => ({ 
            id: s.id, 
            nom: s.nom, 
            createdAt: s.createdAt,
            userId: s.userId || "Système",
            ...getUserInfo(s.userId)
          })),
          ["id", "nom", "userId", "userName", "userEmail", "createdAt"]
        );
        downloadCSV(csv, `socials_${dateStr}.csv`);
        setExportStatus(prev => prev ? { ...prev, socials: "success" } : null);
      }

      // Export Content Types
      if (contentTypes) {
        const csv = generateCSV(
          contentTypes.map(c => ({ 
            id: c.id, 
            nom: c.nom, 
            createdAt: c.createdAt,
            userId: c.userId || "Système",
            ...getUserInfo(c.userId)
          })),
          ["id", "nom", "userId", "userName", "userEmail", "createdAt"]
        );
        downloadCSV(csv, `content_types_${dateStr}.csv`);
        setExportStatus(prev => prev ? { ...prev, contentTypes: "success" } : null);
      }

      // Export Objectives
      if (objectives) {
        const csv = generateCSV(
          objectives.map(o => ({ 
            id: o.id, 
            nom: o.nom, 
            createdAt: o.createdAt,
            userId: o.userId || "Système",
            ...getUserInfo(o.userId)
          })),
          ["id", "nom", "userId", "userName", "userEmail", "createdAt"]
        );
        downloadCSV(csv, `objectives_${dateStr}.csv`);
        setExportStatus(prev => prev ? { ...prev, objectives: "success" } : null);
      }

      // Export Channels
      if (channels) {
        const csv = generateCSV(
          channels.map(c => ({ 
            id: c.id, 
            nom: c.nom, 
            lien: c.lien, 
            createdAt: c.createdAt,
            userId: c.userId || "N/A",
            ...getUserInfo(c.userId)
          })),
          ["id", "nom", "lien", "userId", "userName", "userEmail", "createdAt"]
        );
        downloadCSV(csv, `channels_${dateStr}.csv`);
        setExportStatus(prev => prev ? { ...prev, channels: "success" } : null);
      }

      // Export UTM Links avec informations utilisateur détaillées
      if (filteredLinks.length > 0) {
        // Récupérer les noms des réseaux sociaux, types de contenu, objectifs
        const getSocialName = (id: number) => socials?.find(s => s.id === id)?.nom || "N/A";
        const getContentTypeName = (id: number) => contentTypes?.find(c => c.id === id)?.nom || "N/A";
        const getObjectiveName = (id: number) => objectives?.find(o => o.id === id)?.nom || "N/A";
        const getChannelName = (id: number | null) => id ? channels?.find(c => c.id === id)?.nom || "N/A" : "N/A";

        const csv = generateCSV(
          filteredLinks.map(link => {
            const userInfo = getUserInfo(link.userId);
            return {
              // Informations utilisateur
              userId: link.userId || "N/A",
              userName: userInfo.userName,
              userEmail: userInfo.userEmail,
              // Informations du lien
              id: link.id,
              destination_url: link.destinationUrl,
              short_url: link.shortUrl || "N/A",
              // Paramètres UTM
              utm_source: link.utmSource,
              utm_medium: link.utmMedium,
              utm_campaign: link.utmCampaign,
              utm_term: link.utmTerm || "",
              utm_content: link.utmContent || "",
              // Catégorisation
              social_id: link.socialId,
              social_name: getSocialName(link.socialId),
              content_type_id: link.contentTypeId,
              content_type_name: getContentTypeName(link.contentTypeId),
              objectif_id: link.objectifId,
              objectif_name: getObjectiveName(link.objectifId),
              channel_id: link.channelId,
              channel_name: getChannelName(link.channelId),
              // Informations marketing
              angle_marketing: link.angleMarketing || "",
              hook: link.hook || "",
              audience_cible: link.audienceCible || "",
              budget: link.budget || "",
              // Statistiques
              click_count: link.clickCount || 0,
              // Métadonnées
              generated_url: link.generatedUrl,
              createdAt: link.createdAt,
            };
          }),
          [
            "userId", "userName", "userEmail",
            "id", "destination_url", "short_url",
            "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "social_id", "social_name", "content_type_id", "content_type_name",
            "objectif_id", "objectif_name", "channel_id", "channel_name",
            "angle_marketing", "hook", "audience_cible", "budget",
            "click_count", "generated_url", "createdAt"
          ]
        );
        downloadCSV(csv, `utm_links_${dateStr}.csv`);
        setExportStatus(prev => prev ? { ...prev, utmLinks: "success" } : null);
      }

      toast.success("Export terminé! Les fichiers CSV ont été téléchargés.");
    } catch (error) {
      toast.error("Erreur lors de l'export");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusIcon = (status: "pending" | "success" | "error") => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const filteredLinksCount = getFilteredLinks().length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter les données
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export des données
          </DialogTitle>
          <DialogDescription>
            Exportez toutes vos données en fichiers CSV pour les importer dans Google Sheets ou Excel.
            {isAdmin && " En tant qu'administrateur, vous pouvez filtrer par utilisateur."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filtre par utilisateur (admin only) */}
          {isAdmin && users && users.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Filtrer par utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={filterUserId} onValueChange={setFilterUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les utilisateurs" />
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
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tables à exporter</CardTitle>
              <CardDescription className="text-xs">
                Chaque fichier CSV inclut les informations utilisateur (ID, nom, email)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Réseaux sociaux</span>
                <span className="text-xs text-muted-foreground">{socials?.length || 0} entrées</span>
                {exportStatus && getStatusIcon(exportStatus.socials)}
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Types de contenu</span>
                <span className="text-xs text-muted-foreground">{contentTypes?.length || 0} entrées</span>
                {exportStatus && getStatusIcon(exportStatus.contentTypes)}
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Objectifs</span>
                <span className="text-xs text-muted-foreground">{objectives?.length || 0} entrées</span>
                {exportStatus && getStatusIcon(exportStatus.objectives)}
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Canaux</span>
                <span className="text-xs text-muted-foreground">{channels?.length || 0} entrées</span>
                {exportStatus && getStatusIcon(exportStatus.channels)}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Liens UTM</span>
                <span className="text-xs text-muted-foreground">
                  {filteredLinksCount} entrées
                  {isAdmin && filterUserId !== "all" && ` (filtré)`}
                </span>
                {exportStatus && getStatusIcon(exportStatus.utmLinks)}
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">Colonnes incluses dans l'export UTM :</p>
            <p className="text-xs">
              userId, userName, userEmail, destination_url, short_url, utm_source, utm_medium, 
              utm_campaign, social_name, content_type_name, objectif_name, channel_name, 
              angle_marketing, hook, audience_cible, budget, click_count, createdAt
            </p>
          </div>

          <Button 
            onClick={handleExportAll} 
            disabled={exporting}
            className="w-full"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter toutes les tables
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Copy, Trash2, ExternalLink, Search, Link2, Calendar as CalendarIcon, Target, Image as ImageIcon, Upload, X, Filter, MousePointer, User } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import StatsDialog from "@/components/StatsDialog";
import type { DateRange } from "react-day-picker";

export default function UtmLinksList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLink, setSelectedLink] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<number | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedLinkForImage, setSelectedLinkForImage] = useState<number | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedLinkForStats, setSelectedLinkForStats] = useState<number | null>(null);
  
  // Filtres
  const [filterSocial, setFilterSocial] = useState<string>("all");
  const [filterContentType, setFilterContentType] = useState<string>("all");
  const [filterObjective, setFilterObjective] = useState<string>("all");
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: utmLinks, refetch } = trpc.utmLinks.list.useQuery(
    isAdmin && filterUserId !== "all" ? { filterUserId: parseInt(filterUserId) } : undefined
  );
  const { data: socials } = trpc.socials.list.useQuery();
  const { data: contentTypes } = trpc.contentTypes.list.useQuery();
  const { data: objectives } = trpc.objectives.list.useQuery();
  const { data: users } = trpc.users.list.useQuery(undefined, { enabled: isAdmin });
  const { data: images, refetch: refetchImages } = trpc.images.listByUtmLink.useQuery(
    { utmLinkId: selectedLinkForImage || 0 },
    { enabled: !!selectedLinkForImage }
  );

  const deleteUtmLink = trpc.utmLinks.delete.useMutation({
    onSuccess: () => {
      toast.success("Lien UTM supprimé");
      refetch();
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const uploadImage = trpc.images.upload.useMutation({
    onSuccess: () => {
      toast.success("Image uploadée avec succès");
      refetchImages();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteImage = trpc.images.delete.useMutation({
    onSuccess: () => {
      toast.success("Image supprimée");
      refetchImages();
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lien copié dans le presse-papier!");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleDelete = (id: number) => {
    setLinkToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (linkToDelete) {
      deleteUtmLink.mutate({ id: linkToDelete });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, utmLinkId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await uploadImage.mutateAsync({
        utmLinkId,
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const getSocialName = (id: number) => socials?.find(s => s.id === id)?.nom || "N/A";
  const getContentTypeName = (id: number) => contentTypes?.find(c => c.id === id)?.nom || "N/A";
  const getObjectiveName = (id: number) => objectives?.find(o => o.id === id)?.nom || "N/A";

  const clearFilters = () => {
    setFilterSocial("all");
    setFilterContentType("all");
    setFilterObjective("all");
    setFilterUserId("all");
    setDateRange(undefined);
    setSearchTerm("");
  };

  const hasActiveFilters = filterSocial !== "all" || filterContentType !== "all" || filterObjective !== "all" || filterUserId !== "all" || searchTerm !== "" || dateRange !== undefined;

  const filteredLinks = utmLinks?.filter(link => {
    // Filtre par recherche textuelle
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || (
      link.generatedUrl.toLowerCase().includes(searchLower) ||
      link.utmCampaign.toLowerCase().includes(searchLower) ||
      link.utmSource.toLowerCase().includes(searchLower) ||
      (link.angleMarketing?.toLowerCase().includes(searchLower)) ||
      (link.hook?.toLowerCase().includes(searchLower))
    );

    // Filtre par réseau social
    const matchesSocial = filterSocial === "all" || link.socialId.toString() === filterSocial;

    // Filtre par type de contenu
    const matchesContentType = filterContentType === "all" || link.contentTypeId.toString() === filterContentType;

    // Filtre par objectif
    const matchesObjective = filterObjective === "all" || link.objectifId.toString() === filterObjective;

    // Filtre par période
    let matchesDateRange = true;
    if (dateRange?.from) {
      const linkDate = new Date(link.createdAt);
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDateRange = isWithinInterval(linkDate, { start: from, end: to });
    }

    return matchesSearch && matchesSocial && matchesContentType && matchesObjective && matchesDateRange;
  });

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Link2 className="h-5 w-5 text-slate-600" />
                  Liens UTM générés
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {filteredLinks?.length || 0} lien(s) sur {utmLinks?.length || 0} total
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-slate-200 focus:border-slate-400"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-col md:flex-row gap-3 p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Filter className="h-4 w-4" />
                Filtres:
              </div>
              <div className="flex flex-wrap gap-3 flex-1">
                {/* Filtre par utilisateur (Admin seulement) */}
                {isAdmin && (
                  <Select value={filterUserId} onValueChange={setFilterUserId}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-200">
                      <User className="h-4 w-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      {users?.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={filterSocial} onValueChange={setFilterSocial}>
                  <SelectTrigger className="w-[160px] bg-white border-slate-200">
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
                  <SelectTrigger className="w-[160px] bg-white border-slate-200">
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
                  <SelectTrigger className="w-[160px] bg-white border-slate-200">
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

                {/* Filtre par période avec calendrier */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal border-slate-200 bg-white">
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: fr })} - {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: fr })
                        )
                      ) : (
                        <span className="text-slate-500">Sélectionner une période</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-700">
                    <X className="h-4 w-4 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!filteredLinks?.length ? (
            <div className="text-center py-12 text-slate-500">
              <Link2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
              {hasActiveFilters ? (
                <>
                  <p className="font-medium">Aucun lien ne correspond aux filtres sélectionnés</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2 text-slate-600">
                    Effacer les filtres
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-medium">Aucun lien UTM créé pour le moment</p>
                  <p className="text-sm mt-1">Utilisez le formulaire ci-dessus pour créer votre premier lien</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md bg-white ${
                    selectedLink === link.id ? "ring-2 ring-slate-400 border-slate-400" : "border-slate-200"
                  }`}
                  onClick={() => setSelectedLink(selectedLink === link.id ? null : link.id)}
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-slate-700 hover:bg-slate-800 text-white">{getSocialName(link.socialId)}</Badge>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">{getContentTypeName(link.contentTypeId)}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1 border-slate-300 text-slate-600">
                        <Target className="h-3 w-3" />
                        {getObjectiveName(link.objectifId)}
                      </Badge>
                      {/* Badge de clics cliquable */}
                      <Badge 
                        variant="outline" 
                        className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-colors border-slate-300 text-slate-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLinkForStats(link.id);
                          setShowStatsDialog(true);
                        }}
                      >
                        <MousePointer className="h-3 w-3" />
                        {link.clickCount || 0} clic{(link.clickCount || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(link.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </div>
                  </div>

                  {/* UTM URL */}
                  <div className="bg-slate-50 p-3 rounded-md mb-3 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Lien UTM complet:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm flex-1 break-all text-slate-700">{link.generatedUrl}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(link.generatedUrl);
                        }}
                        title="Copier le lien"
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(link.generatedUrl, "_blank");
                        }}
                        title="Ouvrir le lien"
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Short URL */}
                  {link.shortUrl && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md mb-3">
                      <p className="text-xs text-emerald-700 mb-1 font-medium">Lien raccourci (style Bitly):</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center">
                          <span className="text-sm text-emerald-600">https://</span>
                          <span className="text-sm font-semibold text-emerald-800">{link.shortUrl.replace(/^https?:\/\//, '')}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(link.shortUrl || '');
                          }}
                          title="Copier le lien court"
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(link.shortUrl, "_blank");
                          }}
                          title="Ouvrir le lien court"
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Marketing Info (expanded) */}
                  {selectedLink === link.id && (
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      {link.angleMarketing && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium">Angle marketing:</p>
                          <p className="text-sm text-slate-700">{link.angleMarketing}</p>
                        </div>
                      )}
                      {link.hook && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium">Hook:</p>
                          <p className="text-sm text-slate-700">{link.hook}</p>
                        </div>
                      )}
                      {link.audienceCible && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium">Audience ciblée:</p>
                          <p className="text-sm text-slate-700">{link.audienceCible}</p>
                        </div>
                      )}
                      {link.budget && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1 font-medium">Budget:</p>
                          <p className="text-sm text-slate-700">{link.budget}</p>
                        </div>
                      )}
                      
                      {/* Image upload section */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-slate-500 font-medium">Visuels de la publication:</p>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, link.id)}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="pointer-events-none border-slate-300"
                              disabled={uploadImage.isPending}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Ajouter
                            </Button>
                          </label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLinkForImage(link.id);
                            setShowImageDialog(true);
                          }}
                          className="text-slate-600"
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          Voir les images
                        </Button>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(link.id);
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-slate-500">
              Êtes-vous sûr de vouloir supprimer ce lien UTM ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-slate-300">
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteUtmLink.isPending} className="bg-red-600 hover:bg-red-700">
              {deleteUtmLink.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Images Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Images de la publication</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {images?.length === 0 ? (
              <p className="col-span-full text-center text-slate-500 py-8">
                Aucune image pour cette publication
              </p>
            ) : (
              images?.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-red-600"
                    onClick={() => deleteImage.mutate({ id: img.id })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => selectedLinkForImage && handleImageUpload(e, selectedLinkForImage)}
              />
              <Button variant="outline" className="pointer-events-none border-slate-300">
                <Upload className="h-4 w-4 mr-2" />
                Ajouter une image
              </Button>
            </label>
            <Button onClick={() => setShowImageDialog(false)} className="bg-slate-700 hover:bg-slate-800">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <StatsDialog
        open={showStatsDialog}
        onOpenChange={setShowStatsDialog}
        utmLinkId={selectedLinkForStats || 0}
        linkName={utmLinks?.find(l => l.id === selectedLinkForStats)?.utmCampaign}
      />
    </>
  );
}

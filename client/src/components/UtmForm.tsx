import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Plus, Link2, Sparkles, Loader2, Copy, Check, ExternalLink, HelpCircle } from "lucide-react";

interface UtmFormProps {
  onSuccess?: () => void;
}

// Groupement des réseaux sociaux par plateforme avec hiérarchie claire
const socialGroups = {
  "YouTube": ["YouTube", "YouTube Ads"],
  "Facebook": ["Facebook", "Facebook Ads"],
  "Instagram": ["Instagram", "Instagram Ads"],
  "WhatsApp": ["WhatsApp", "WhatsApp Ads"],
  "Threads": ["Threads", "Threads Ads"],
  "TikTok": ["TikTok", "TikTok for Business"],
  "X (Twitter)": ["X (Twitter)", "X Ads"],
  "Snapchat": ["Snapchat", "Snapchat Ads"],
  "LinkedIn": ["LinkedIn", "LinkedIn Ads"],
  "Pinterest": ["Pinterest", "Pinterest Ads"],
  "Autres plateformes": ["Google Ads", "Apple Search Ads"],
};

export default function UtmForm({ onSuccess }: UtmFormProps) {
  // Form state
  const [destinationUrl, setDestinationUrl] = useState("");
  const [socialId, setSocialId] = useState<string>("");
  const [contentTypeId, setContentTypeId] = useState<string>("");
  const [objectifId, setObjectifId] = useState<string>("");
  const [channelName, setChannelName] = useState("");
  const [channelLink, setChannelLink] = useState("");
  const [angleMarketing, setAngleMarketing] = useState("");
  const [hook, setHook] = useState("");
  const [audienceCible, setAudienceCible] = useState("");
  const [budget, setBudget] = useState("");

  // Generated link state
  const [generatedLink, setGeneratedLink] = useState<{
    fullUrl: string;
    shortUrl: string;
  } | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);

  // Dialog state for "Autre" option
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"social" | "contentType" | "objective">("social");
  const [newValue, setNewValue] = useState("");

  // Queries
  const { data: socials, refetch: refetchSocials } = trpc.socials.list.useQuery();
  const { data: contentTypes, refetch: refetchContentTypes } = trpc.contentTypes.list.useQuery();
  const { data: objectives, refetch: refetchObjectives } = trpc.objectives.list.useQuery();
  const { data: audiences } = trpc.audiences.list.useQuery();

  // Mutations
  const createSocial = trpc.socials.create.useMutation({
    onSuccess: () => {
      refetchSocials();
      toast.success("Réseau social ajouté");
    },
  });

  const createContentType = trpc.contentTypes.create.useMutation({
    onSuccess: () => {
      refetchContentTypes();
      toast.success("Type de contenu ajouté");
    },
  });

  const createObjective = trpc.objectives.create.useMutation({
    onSuccess: () => {
      refetchObjectives();
      toast.success("Objectif ajouté");
    },
  });

  const createUtmLink = trpc.utmLinks.create.useMutation({
    onSuccess: (data) => {
      toast.success("Lien UTM créé avec succès!");
      setGeneratedLink({
        fullUrl: data.generatedUrl,
        shortUrl: data.shortUrl || '',
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const getSuggestions = trpc.suggestions.getMarketingSuggestions.useMutation();

  const handleSelectChange = (value: string, type: "social" | "contentType" | "objective") => {
    if (value === "autre") {
      setAddDialogType(type);
      setNewValue("");
      setShowAddDialog(true);
      return;
    }

    switch (type) {
      case "social":
        setSocialId(value);
        break;
      case "contentType":
        setContentTypeId(value);
        break;
      case "objective":
        setObjectifId(value);
        break;
    }
  };

  const handleAddNew = async () => {
    if (!newValue.trim()) {
      toast.error("Veuillez entrer une valeur");
      return;
    }

    try {
      let result;
      switch (addDialogType) {
        case "social":
          result = await createSocial.mutateAsync({ nom: newValue });
          setSocialId(result.id.toString());
          break;
        case "contentType":
          result = await createContentType.mutateAsync({ nom: newValue });
          setContentTypeId(result.id.toString());
          break;
        case "objective":
          result = await createObjective.mutateAsync({ nom: newValue });
          setObjectifId(result.id.toString());
          break;
      }
      setShowAddDialog(false);
      setNewValue("");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleGetSuggestions = async () => {
    const social = socials?.find(s => s.id.toString() === socialId);
    const contentType = contentTypes?.find(c => c.id.toString() === contentTypeId);
    const objective = objectives?.find(o => o.id.toString() === objectifId);

    if (!social || !contentType || !objective) {
      toast.error("Veuillez d'abord sélectionner le réseau social, le type de contenu et l'objectif");
      return;
    }

    try {
      const result = await getSuggestions.mutateAsync({
        social: social.nom,
        contentType: contentType.nom,
        objective: objective.nom,
        currentAngle: angleMarketing,
        currentHook: hook,
        audience: audienceCible,
      });
      
      toast.success("Suggestions générées!", {
        description: "Consultez les suggestions ci-dessous",
        duration: 5000,
      });
      
      const suggestionText = typeof result.suggestions === 'string' ? result.suggestions : '';
      toast.info(suggestionText.substring(0, 200) + "...", {
        duration: 10000,
      });
    } catch (error) {
      toast.error("Erreur lors de la génération des suggestions");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const social = socials?.find(s => s.id.toString() === socialId);
    const contentType = contentTypes?.find(c => c.id.toString() === contentTypeId);
    const objective = objectives?.find(o => o.id.toString() === objectifId);

    if (!destinationUrl || !social || !contentType || !objective) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createUtmLink.mutateAsync({
        destinationUrl,
        socialId: parseInt(socialId),
        socialName: social.nom,
        contentTypeId: parseInt(contentTypeId),
        contentTypeName: contentType.nom,
        objectifId: parseInt(objectifId),
        objectifName: objective.nom,
        channelName: channelName || undefined,
        channelLink: channelLink || undefined,
        angleMarketing: angleMarketing || undefined,
        hook: hook || undefined,
        audienceCible: audienceCible || undefined,
        budget: budget || undefined,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setDestinationUrl("");
    setSocialId("");
    setContentTypeId("");
    setObjectifId("");
    setChannelName("");
    setChannelLink("");
    setAngleMarketing("");
    setHook("");
    setAudienceCible("");
    setBudget("");
    setGeneratedLink(null);
  };

  const copyToClipboard = async (text: string, type: 'full' | 'short') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'full') {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2000);
      } else {
        setCopiedShort(true);
        setTimeout(() => setCopiedShort(false), 2000);
      }
      toast.success("Lien copié!");
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

  const getDialogTitle = () => {
    switch (addDialogType) {
      case "social": return "Ajouter un réseau social";
      case "contentType": return "Ajouter un type de contenu";
      case "objective": return "Ajouter un objectif";
    }
  };

  // Organiser les réseaux sociaux par groupe
  const organizedSocials = () => {
    if (!socials) return [];
    
    const grouped: { [key: string]: typeof socials } = {};
    
    for (const [groupName, socialNames] of Object.entries(socialGroups)) {
      const groupSocials = socials.filter(s => socialNames.includes(s.nom));
      if (groupSocials.length > 0) {
        grouped[groupName] = groupSocials;
      }
    }
    
    // Ajouter les réseaux non groupés
    const allGroupedNames = Object.values(socialGroups).flat();
    const ungrouped = socials.filter(s => !allGroupedNames.includes(s.nom));
    if (ungrouped.length > 0) {
      grouped["Autres plateformes"] = [...(grouped["Autres plateformes"] || []), ...ungrouped];
    }
    
    return grouped;
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Créer un lien UTM
          </CardTitle>
          <CardDescription>
            Remplissez les informations pour générer automatiquement un lien UTM traçable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination URL */}
            <div className="space-y-2">
              <Label htmlFor="destinationUrl">Lien de destination *</Label>
              <Input
                id="destinationUrl"
                type="url"
                placeholder="https://example.com/landing-page"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
              />
            </div>

            {/* Dropdowns Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Social Network - Grouped with visual hierarchy */}
              <div className="space-y-2">
                <Label>Réseau social *</Label>
                <Select value={socialId} onValueChange={(v) => handleSelectChange(v, "social")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {Object.entries(organizedSocials()).map(([groupName, groupSocials]) => (
                      <SelectGroup key={groupName}>
                        <SelectLabel className="text-xs font-bold text-blue-600 uppercase tracking-wide py-2 px-2 bg-blue-50/50">
                          {groupName}
                        </SelectLabel>
                        {groupSocials.map((social) => (
                          <SelectItem 
                            key={social.id} 
                            value={social.id.toString()}
                            className="pl-4"
                          >
                            {social.nom}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                    <SelectItem value="autre" className="text-primary font-medium border-t mt-2 pt-2">
                      <span className="flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Autre...
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label>Type de contenu *</Label>
                <Select value={contentTypeId} onValueChange={(v) => handleSelectChange(v, "contentType")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes?.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id.toString()}>
                        {ct.nom}
                      </SelectItem>
                    ))}
                    <SelectItem value="autre" className="text-primary font-medium border-t mt-2 pt-2">
                      <span className="flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Autre...
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Objective */}
              <div className="space-y-2">
                <Label>Objectif *</Label>
                <Select value={objectifId} onValueChange={(v) => handleSelectChange(v, "objective")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives?.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id.toString()}>
                        {obj.nom}
                      </SelectItem>
                    ))}
                    <SelectItem value="autre" className="text-primary font-medium border-t mt-2 pt-2">
                      <span className="flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Autre...
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Channel Info with Help Tooltips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="channelName">Nom du canal/chaîne</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">
                        <strong>Nom du canal, de la page ou du compte</strong> sur lequel le contenu a été publié.
                        <br /><br />
                        <em>Exemple : "Ma chaîne YouTube", "Page Facebook Entreprise", "@moncompte_insta"</em>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="channelName"
                  type="text"
                  placeholder="Ex: Ma chaîne YouTube"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="channelLink">Lien du canal/chaîne</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">
                        <strong>URL du canal, de la page ou du compte</strong> où le contenu est publié.
                        <br /><br />
                        <em>Il s'agit du support de publication, pas du lien de destination de la campagne.</em>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="channelLink"
                  type="url"
                  placeholder="https://youtube.com/@machaîne"
                  value={channelLink}
                  onChange={(e) => setChannelLink(e.target.value)}
                />
              </div>
            </div>

            {/* Marketing Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Informations marketing</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetSuggestions}
                  disabled={getSuggestions.isPending}
                >
                  {getSuggestions.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Obtenir des suggestions IA
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="angleMarketing">Angle marketing</Label>
                <Textarea
                  id="angleMarketing"
                  placeholder="Décrivez l'angle marketing utilisé..."
                  value={angleMarketing}
                  onChange={(e) => setAngleMarketing(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hook">Script du hook</Label>
                <Textarea
                  id="hook"
                  placeholder="Le hook d'accroche de votre publication..."
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audienceCible">Audience ciblée</Label>
                  <Input
                    id="audienceCible"
                    type="text"
                    placeholder="Ex: Entrepreneurs 25-45 ans"
                    value={audienceCible}
                    onChange={(e) => setAudienceCible(e.target.value)}
                    list="audience-suggestions"
                  />
                  <datalist id="audience-suggestions">
                    {audiences?.map((a) => (
                      <option key={a.id} value={a.nom} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget / Sponsorisation</Label>
                  <Input
                    id="budget"
                    type="text"
                    placeholder="Ex: 500€"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Generated Link Display */}
            {generatedLink && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Lien UTM généré avec succès!
                </h3>
                
                {/* Full UTM Link */}
                <div className="space-y-2">
                  <Label className="text-green-700">Lien UTM complet</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedLink.fullUrl} 
                      readOnly 
                      className="bg-white text-sm font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(generatedLink.fullUrl, 'full')}
                      className="shrink-0"
                    >
                      {copiedFull ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(generatedLink.fullUrl, '_blank')}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Short Link */}
                {generatedLink.shortUrl && (
                  <div className="space-y-2">
                    <Label className="text-green-700">Lien raccourci</Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 bg-white border rounded-md px-3 py-2 text-sm">
                        <span className="text-gray-400">https://</span>
                        <span className="font-bold text-green-700">
                          {generatedLink.shortUrl.replace('https://', '')}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(generatedLink.shortUrl, 'short')}
                        className="shrink-0"
                      >
                        {copiedShort ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(generatedLink.shortUrl, '_blank')}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createUtmLink.isPending}
              >
                {createUtmLink.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                Générer le lien UTM
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Réinitialiser
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add New Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newValue">Nouvelle valeur</Label>
            <Input
              id="newValue"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Entrez la nouvelle valeur..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddNew} disabled={createSocial.isPending || createContentType.isPending || createObjective.isPending}>
              {(createSocial.isPending || createContentType.isPending || createObjective.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

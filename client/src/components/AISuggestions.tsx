import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Lightbulb, Copy, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { Streamdown } from "streamdown";

export default function AISuggestions() {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [socialId, setSocialId] = useState("");
  const [contentTypeId, setContentTypeId] = useState("");
  const [objectiveId, setObjectiveId] = useState("");
  const [currentAngle, setCurrentAngle] = useState("");
  const [currentHook, setCurrentHook] = useState("");
  const [audience, setAudience] = useState("");
  const [suggestions, setSuggestions] = useState<string | null>(null);

  const { data: socials } = trpc.socials.list.useQuery();
  const { data: contentTypes } = trpc.contentTypes.list.useQuery();
  const { data: objectives } = trpc.objectives.list.useQuery();

  const getSuggestions = trpc.suggestions.getMarketingSuggestions.useMutation({
    onSuccess: (data) => {
      const suggestionText = typeof data.suggestions === 'string' ? data.suggestions : '';
      setSuggestions(suggestionText);
      toast.success("Suggestions générées avec succès!");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleGenerate = async () => {
    const social = socials?.find(s => s.id.toString() === socialId);
    const contentType = contentTypes?.find(c => c.id.toString() === contentTypeId);
    const objective = objectives?.find(o => o.id.toString() === objectiveId);

    if (!social || !contentType || !objective) {
      toast.error("Veuillez sélectionner le réseau social, le type de contenu et l'objectif");
      return;
    }

    setSuggestions(null);
    await getSuggestions.mutateAsync({
      social: social.nom,
      contentType: contentType.nom,
      objective: objective.nom,
      currentAngle: currentAngle || undefined,
      currentHook: currentHook || undefined,
      audience: audience || undefined,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié dans le presse-papier!");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const resetForm = () => {
    setSocialId("");
    setContentTypeId("");
    setObjectiveId("");
    setCurrentAngle("");
    setCurrentHook("");
    setAudience("");
    setSuggestions(null);
  };

  const dialogClasses = isFullscreen 
    ? "w-screen h-screen max-w-none max-h-none rounded-none" 
    : "max-w-4xl max-h-[90vh]";

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setIsFullscreen(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-amber-300 hover:bg-amber-50 hover:border-amber-400">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Assistant IA Marketing
        </Button>
      </DialogTrigger>
      <DialogContent className={`${dialogClasses} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Suggestions Marketing IA
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={resetForm}
                title="Réinitialiser"
                className="h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Réduire" : "Plein écran"}
                className="h-8 w-8"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className={`flex-1 overflow-y-auto space-y-6 py-4 px-1 ${isFullscreen ? 'max-w-5xl mx-auto w-full' : ''}`}>
          {/* Input Section */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
              <CardTitle className="text-base">Contexte de la publication</CardTitle>
              <CardDescription>
                Renseignez les informations pour obtenir des suggestions personnalisées d'angles marketing et de hooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Réseau social <span className="text-red-500">*</span></Label>
                  <Select value={socialId} onValueChange={setSocialId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {socials?.map((social) => (
                        <SelectItem key={social.id} value={social.id.toString()}>
                          {social.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type de contenu <span className="text-red-500">*</span></Label>
                  <Select value={contentTypeId} onValueChange={setContentTypeId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes?.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id.toString()}>
                          {ct.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Objectif <span className="text-red-500">*</span></Label>
                  <Select value={objectiveId} onValueChange={setObjectiveId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives?.map((obj) => (
                        <SelectItem key={obj.id} value={obj.id.toString()}>
                          {obj.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Audience ciblée <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Textarea
                  placeholder="Ex: Entrepreneurs débutants 25-40 ans, intéressés par la liberté financière..."
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  rows={2}
                  className="bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Angle marketing actuel <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                  <Textarea
                    placeholder="Ex: Transformation personnelle, success story, urgence limitée..."
                    value={currentAngle}
                    onChange={(e) => setCurrentAngle(e.target.value)}
                    rows={2}
                    className="bg-white resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hook actuel <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                  <Textarea
                    placeholder="Ex: Et si je vous disais que..., La vérité sur..., Ce que personne ne vous dit..."
                    value={currentHook}
                    onChange={(e) => setCurrentHook(e.target.value)}
                    rows={2}
                    className="bg-white resize-none"
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={getSuggestions.isPending || !socialId || !contentTypeId || !objectiveId}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                size="lg"
              >
                {getSuggestions.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer des suggestions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {suggestions && (
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Suggestions générées
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(suggestions)}
                    className="border-amber-300 hover:bg-amber-100"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none prose-headings:text-amber-800 prose-strong:text-amber-700 prose-li:marker:text-amber-500 bg-white rounded-lg p-4 shadow-inner">
                  <Streamdown>{suggestions}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {getSuggestions.isPending && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-25"></div>
                    <Sparkles className="h-12 w-12 text-amber-500 animate-pulse relative" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-amber-800">L'IA analyse votre contexte...</p>
                    <p className="text-sm text-amber-600 mt-1">Génération de suggestions personnalisées en cours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

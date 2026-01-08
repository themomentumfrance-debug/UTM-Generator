import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Lightbulb, Copy, RotateCcw, X, ChevronDown, ChevronUp } from "lucide-react";
import { Streamdown } from "streamdown";

interface AISuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AISuggestionsPanel({ isOpen, onClose }: AISuggestionsPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-2xl shadow-2xl rounded-xl border border-amber-200 bg-white overflow-hidden">
      {/* Header - toujours visible */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          <span className="font-semibold">Assistant IA Marketing</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={resetForm}
            title="Réinitialiser"
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Agrandir" : "Réduire"}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            title="Fermer"
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content - masqué si minimisé */}
      {!isMinimized && (
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Input Section */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2 bg-slate-50 rounded-t-lg">
                <CardTitle className="text-sm">Contexte de la publication</CardTitle>
                <CardDescription className="text-xs">
                  Renseignez les informations pour obtenir des suggestions personnalisées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Réseau social *</Label>
                    <Select value={socialId} onValueChange={setSocialId}>
                      <SelectTrigger className="bg-white h-9 text-sm">
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

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Type de contenu *</Label>
                    <Select value={contentTypeId} onValueChange={setContentTypeId}>
                      <SelectTrigger className="bg-white h-9 text-sm">
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

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Objectif *</Label>
                    <Select value={objectiveId} onValueChange={setObjectiveId}>
                      <SelectTrigger className="bg-white h-9 text-sm">
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

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Audience ciblée <span className="text-muted-foreground">(optionnel)</span></Label>
                  <Textarea
                    placeholder="Ex: Entrepreneurs 25-40 ans, intéressés par la liberté financière..."
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    rows={1}
                    className="bg-white resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Angle marketing <span className="text-muted-foreground">(optionnel)</span></Label>
                    <Textarea
                      placeholder="Ex: Transformation personnelle..."
                      value={currentAngle}
                      onChange={(e) => setCurrentAngle(e.target.value)}
                      rows={1}
                      className="bg-white resize-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Hook actuel <span className="text-muted-foreground">(optionnel)</span></Label>
                    <Textarea
                      placeholder="Ex: Et si je vous disais que..."
                      value={currentHook}
                      onChange={(e) => setCurrentHook(e.target.value)}
                      rows={1}
                      className="bg-white resize-none text-sm"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={getSuggestions.isPending || !socialId || !contentTypeId || !objectiveId}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
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

            {/* Loading State */}
            {getSuggestions.isPending && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-25"></div>
                      <Sparkles className="h-10 w-10 text-amber-500 animate-pulse relative" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-amber-800">L'IA analyse votre contexte...</p>
                      <p className="text-sm text-amber-600 mt-1">Génération de suggestions personnalisées</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {suggestions && (
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Suggestions générées
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(suggestions)}
                      className="border-amber-300 hover:bg-amber-100 h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none prose-headings:text-amber-800 prose-headings:text-base prose-strong:text-amber-700 prose-li:marker:text-amber-500 bg-white rounded-lg p-4 shadow-inner text-sm leading-relaxed">
                    <Streamdown>{suggestions}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

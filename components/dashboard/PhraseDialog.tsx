"use client";

import { useState, useTransition } from "react";
import { createPhrase, updatePhrase } from "@/app/actions/phrases";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type PhraseDialogPhrase = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
};

type Props = {
  mode: "create" | "edit";
  phrase?: PhraseDialogPhrase;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function PhraseDialog({
  mode,
  phrase,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [title, setTitle] = useState(phrase?.title ?? "");
  const [content, setContent] = useState(phrase?.content ?? "");
  const [isPublic, setIsPublic] = useState(phrase?.isPublic ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetFromPhrase() {
    setTitle(phrase?.title ?? "");
    setContent(phrase?.content ?? "");
    setIsPublic(phrase?.isPublic ?? false);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (next) resetFromPhrase();
    setOpen(next);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = { title, content, isPublic };
      const result =
        mode === "create"
          ? await createPhrase(payload)
          : await updatePhrase(phrase!.id, payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (mode === "create") {
        setTitle("");
        setContent("");
        setIsPublic(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Новая фраза/цитата" : "Редактировать"}
          </DialogTitle>
          <DialogDescription>
            Заголовок, текст и видимость (публичная / приватная).
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="phrase-title">Заголовок</Label>
            <Input
              id="phrase-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Краткое название"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phrase-content">Текст</Label>
            <Textarea
              id="phrase-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Текст фразы или цитаты"
              required
              maxLength={10_000}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Публичная</p>
              <p className="text-xs text-muted">Видна всем пользователям</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Сохранение…"
                : mode === "create"
                  ? "Создать"
                  : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

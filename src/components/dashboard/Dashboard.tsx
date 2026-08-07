import { useState } from 'react';
import { ImagePlus, Moon, Plus, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Input } from '@/components/ui/input';
import { useProjects } from './useProjects';
import { ProjectCard } from './ProjectCard';
import { NewProjectDialog } from './NewProjectDialog';
import { RenameProjectDialog } from './RenameProjectDialog';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { StorageNotice } from './StorageNotice';
import { duplicateAndSaveProject } from '@/lib/db/projects';
import { usePreferences, applyTheme } from '@/lib/store/preferences';
import { goToEditor } from '@/lib/router';
import type { Project } from '@/lib/model/types';

export function Dashboard() {
  const { projects } = useProjects();
  const theme = usePreferences((s) => s.theme);
  const toggleTheme = usePreferences((s) => s.toggleTheme);

  const [newOpen, setNewOpen] = useState(false);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [query, setQuery] = useState('');

  const filtered = projects?.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function handleToggleTheme() {
    toggleTheme();
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  async function handleDuplicate(p: Project) {
    await duplicateAndSaveProject(p.id);
  }

  return (
    <div className="ds-app min-h-full">
      <header className="sticky top-0 z-10 border-b border-hairline bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <h1>
            {/* Wordmark segue o tema via currentColor (text-ink). */}
            <Logo className="h-6 w-auto text-ink" />
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleTheme}
              aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus /> Novo projeto
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <StorageNotice />

        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Projetos</h2>
          {projects && projects.length > 0 && (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome…"
              className="max-w-xs"
              aria-label="Buscar projetos"
            />
          )}
        </div>

        {projects === undefined ? (
          <p className="py-16 text-center text-sm text-mute">Carregando…</p>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setNewOpen(true)} />
        ) : filtered && filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-mute">
            Nenhum projeto encontrado para “{query}”.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered?.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={(proj) => goToEditor(proj.id)}
                onRename={setRenaming}
                onDuplicate={handleDuplicate}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </main>

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} onCreated={goToEditor} />
      <RenameProjectDialog
        project={renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
      />
      <DeleteProjectDialog
        project={deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-hairline py-20 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-elevated text-mute">
          <ImagePlus className="size-6" />
        </div>
        <h3 className="text-base font-semibold">Nenhum projeto ainda</h3>
        <p className="mt-1 text-sm text-mute">
          Crie o primeiro criativo. Você desenha em um formato e os outros dois se adaptam.
        </p>
        <Button className="mt-4" onClick={onCreate}>
          <Plus /> Criar projeto
        </Button>
      </div>
    </div>
  );
}

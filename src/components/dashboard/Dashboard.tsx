import { useState } from 'react';
import {
  Archive,
  FileUp,
  ImagePlus,
  Moon,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Input } from '@/components/ui/input';
import { useProjects } from './useProjects';
import { ProjectCard } from './ProjectCard';
import { NewProjectDialog } from './NewProjectDialog';
import { RenameProjectDialog } from './RenameProjectDialog';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { StorageNotice } from './StorageNotice';
import { duplicateAndSaveProject, getProject } from '@/lib/db/projects';
import {
  buildBackupOfAllProjects,
  buildProjectFile,
  collectProjectAssets,
  importProjectFile,
} from '@/lib/export/projectFile';
import { projectFileName } from '@/lib/export/naming';
import { downloadBlob } from '@/lib/export/zip';
import { usePreferences, applyTheme } from '@/lib/store/preferences';
import { goToEditor, goToGuided, goToLanding } from '@/lib/router';
import { useUi } from '@/lib/store/ui';
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

  const [importError, setImportError] = useState<string | null>(null);
  const [backupState, setBackupState] = useState<string>('idle');

  /** Backup completo (§12): um ZIP com um .criativo por projeto. */
  async function handleExportAll() {
    if (!projects?.length) return;
    setBackupState('Preparando…');
    try {
      const full = await Promise.all(projects.map((p) => getProject(p.id)));
      const blob = await buildBackupOfAllProjects(
        full.filter((p): p is Project => !!p),
        (done, total) => setBackupState(`${done}/${total}…`),
      );
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      downloadBlob(blob, `criativos-backup_${stamp}.zip`);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Não foi possível gerar o backup.',
      );
    } finally {
      setBackupState('idle');
    }
  }

  async function handleExportFile(p: Project) {
    const project = await getProject(p.id);
    if (!project) return;
    const assets = await collectProjectAssets(project);
    const blob = await buildProjectFile(project, assets);
    downloadBlob(blob, projectFileName(project.name));
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.criativo,application/zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setImportError(null);
      try {
        const project = await importProjectFile(file);
        goToEditor(project.id);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : 'Não foi possível importar este arquivo.',
        );
      }
    };
    input.click();
  }

  return (
    <div className="ds-app min-h-full">
      <header className="sticky top-0 z-10 border-b border-hairline bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <h1>
            {/* Wordmark segue o tema via currentColor (text-ink). Clicar volta
                para a página inicial — o caminho de volta que a §13 pede. */}
            <button onClick={goToLanding} title="Página inicial">
              <Logo className="h-6 w-auto text-ink" />
            </button>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => useUi.getState().setSettingsOpen(true)}
              aria-label="Configurações"
              title="Configurações (Cmd+,)"
            >
              <SettingsIcon />
            </Button>
            {projects && projects.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleExportAll()}
                disabled={backupState !== 'idle'}
                title="Backup de todos os projetos num arquivo só"
              >
                <Archive /> {backupState === 'idle' ? 'Exportar todos' : backupState}
              </Button>
            )}
            <Button variant="outline" onClick={handleImport} title="Importar arquivo .criativo">
              <FileUp /> Importar
            </Button>
            {/* Modo guiado (§18): fica ao lado de "Novo projeto", não no lugar
                dele — é uma porta de entrada, não uma substituição. */}
            <Button variant="cta" onClick={() => goToGuided()} title="O app pergunta o que precisa e monta o criativo com você">
              <Wand2 /> Criativo rápido
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus /> Novo projeto
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <StorageNotice onExportAll={() => void handleExportAll()} />
        {importError && (
          <p className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-deep">
            {importError}
          </p>
        )}

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
                onExportFile={(proj) => void handleExportFile(proj)}
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

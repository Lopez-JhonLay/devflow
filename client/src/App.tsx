import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, FileText, Folder, Paperclip } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { buttonVariants } from '@/components/ui/button-variants';
import devflowLogo from '@/assets/devflow-logo-cropped.png';
import './App.css';

const previewTabs = [
  { name: 'Projects', icon: Folder },
  { name: 'Notes', icon: FileText },
  { name: 'Snippets', icon: Code2 },
  { name: 'Files', icon: Paperclip },
] as const;

type PreviewTab = (typeof previewTabs)[number]['name'];

export default function App() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('Projects');

  return (
    <div className="landing">
      <a href="#main-content" className="landing-skip">Skip to content</a>
      <header className="landing-header landing-container">
        <Link to="/" aria-label="DevFlow home" className="landing-brand">
          <img src={devflowLogo} alt="DevFlow" width="1486" height="539" />
        </Link>
        <nav aria-label="Main navigation" className="landing-nav">
          <ThemeToggle />
          <Link to="/login" className={buttonVariants({ variant: 'ghost' })}>Sign in</Link>
          <Link to="/register" className={buttonVariants()}>Sign up</Link>
        </nav>
      </header>

      <main id="main-content" className="landing-container">
        <section className="landing-hero" aria-labelledby="landing-heading">
          <div className="landing-intro">
            <h1 id="landing-heading">A home for everything<br /><span>you’re building.</span></h1>
            <p>Your projects, notes, code snippets, and files. All together in a quiet space to pick up where you left off.</p>
            <div className="landing-actions">
              <Link to="/register" className={buttonVariants({ size: 'lg' })}>Create your workspace</Link>
              <a href="#workspace-preview" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Take a look</a>
            </div>
          </div>

          <section id="workspace-preview" className="landing-preview" aria-label="Example workspace">
            <div className="landing-preview-heading">
              <span className="font-semibold">My workspace</span>
              <span className="text-sm text-muted-foreground">A look inside DevFlow</span>
            </div>
            <div className="landing-preview-body">
              <nav className="landing-preview-nav" aria-label="Workspace preview sections">
                {previewTabs.map(({ name, icon: Icon }) => (
                  <button key={name} type="button" aria-pressed={activeTab === name} onClick={() => setActiveTab(name)}>
                    <Icon size={18} aria-hidden="true" />{name}
                  </button>
                ))}
              </nav>
              <div className="landing-preview-content" aria-live="polite" aria-atomic="true">
                <div className="landing-preview-title">
                  <h2>{activeTab === 'Projects' ? 'Room for your next idea.' : activeTab === 'Notes' ? 'Keep the details close.' : activeTab === 'Snippets' ? 'Good code is worth keeping.' : 'Everything that goes with it.'}</h2>
                  <p>{activeTab === 'Projects' ? 'A home for the things you’re building.' : activeTab === 'Notes' ? 'Notes that stay with your project.' : activeTab === 'Snippets' ? 'Save it once. Find it when you need it.' : 'Screenshots, diagrams, and documents, together.'}</p>
                </div>
                {activeTab === 'Projects' && (
                  <div className="landing-projects">
                    <article className="landing-project">
                      <div className="landing-project-top"><Folder size={22} aria-hidden="true" /><span className="landing-status">Active</span></div>
                      <h3>Personal website</h3>
                      <p>A small corner of the internet for my work and writing.</p>
                      <div className="landing-project-bottom"><span>Design</span><span>Updated today</span></div>
                    </article>
                    <article className="landing-project">
                      <div className="landing-project-top"><Folder size={22} aria-hidden="true" /><span className="landing-status">Active</span></div>
                      <h3>Reading list</h3>
                      <p>A simple place to save the books I want to come back to.</p>
                      <div className="landing-project-bottom"><span>Side project</span><span>Updated yesterday</span></div>
                    </article>
                  </div>
                )}
                {activeTab === 'Notes' && (
                  <article className="landing-note">
                    <span className="text-sm text-muted-foreground">Personal website / Notes</span>
                    <h3>A few things to remember</h3>
                    <p>Keep the homepage simple. Give each project a little room to tell its story.</p>
                    <h4>For the next update</h4>
                    <ul><li>Add the latest project screenshots.</li><li>Write a short introduction.</li><li>Check how everything feels on mobile.</li></ul>
                  </article>
                )}
                {activeTab === 'Snippets' && (
                  <article className="landing-note">
                    <div className="landing-snippet-heading"><h3>Format a date</h3><span className="landing-status">JavaScript</span></div>
                    <p>A small helper for a friendlier date.</p>
                    <pre><code>{`const formatDate = (date) =>\n  new Intl.DateTimeFormat('en', {\n    month: 'short',\n    day: 'numeric',\n  }).format(new Date(date));`}</code></pre>
                  </article>
                )}
                {activeTab === 'Files' && (
                  <div className="landing-files">
                    {[['Homepage sketch.png', 'Personal website · Image'], ['Project notes.pdf', 'Reading list · PDF'], ['Page layout.png', 'Personal website · Image']].map(([name, detail]) => (
                      <div key={name} className="landing-file"><Paperclip size={20} aria-hidden="true" /><div><h3>{name}</h3><p>{detail}</p></div></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </section>

        <section className="landing-details" aria-label="What you can keep in DevFlow">
          <div><Folder aria-hidden="true" /><h2>Projects with a home.</h2><p>Keep links, notes, and progress together, from the first idea to the finished thing.</p></div>
          <div><Code2 aria-hidden="true" /><h2>Code you’ll use again.</h2><p>Save useful snippets, add a few tags, and find the right one without digging.</p></div>
          <div><Paperclip aria-hidden="true" /><h2>The files that belong.</h2><p>Keep screenshots, PDFs, and diagrams right alongside the project they’re for.</p></div>
        </section>
      </main>

      <footer className="landing-footer landing-container">
        <p>DevFlow <span>— A place for your work.</span></p>
        <Link to="/register">Make yourself at home</Link>
      </footer>
    </div>
  );
}

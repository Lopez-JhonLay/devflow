import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-100">
      <div className="rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600">Tailwind v4 is working!</h1>
        <p className="mt-4 text-gray-600">And shadcn/ui is fully configured.</p>

        <div className="mt-6 flex justify-center gap-4">
          <Button variant="default">Default Button</Button>
          <Button variant="outline">Outline Button</Button>
        </div>
      </div>
    </div>
  );
}

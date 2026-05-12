import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-8 shadow-xl shadow-indigo-600/20">
        C
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
        CheckPro AI
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10">
        A plataforma SaaS para correção automática de provas objetivas através de visão computacional e inteligência artificial.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8">
            Entrar
          </Button>
        </Link>
        <Link href="/cadastro">
          <Button size="lg" variant="outline" className="rounded-full px-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            Criar conta
          </Button>
        </Link>
      </div>
    </div>
  );
}

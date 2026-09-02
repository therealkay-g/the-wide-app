export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B6E4F] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B6E4F] to-[#095E42]" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="text-3xl font-bold">WIDE</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Retrouver nos racines.
            <br />
            Préserver notre histoire.
            <br />
            Transmettre notre héritage.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            La plateforme de généalogie et de mémoire familiale conçue pour les
            familles de la RDC, d&apos;Afrique et de la diaspora.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">🌳</p>
              <p className="text-sm text-white/70 mt-1">Arbre généalogique</p>
            </div>
            <div>
              <p className="text-3xl font-bold">📝</p>
              <p className="text-sm text-white/70 mt-1">Témoignages</p>
            </div>
            <div>
              <p className="text-3xl font-bold">🌍</p>
              <p className="text-sm text-white/70 mt-1">Migrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

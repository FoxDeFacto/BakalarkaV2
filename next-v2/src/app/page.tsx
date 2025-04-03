// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileText, Handshake, ListChecks, Speech } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        </div>
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Studentské projekty
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Platforma pro studenty, učitelé a širkou veřejnost s přístupem a správou k studenstkám projektům, voškám a seminárním pracím.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/projects-public">
                <Button variant="primary" size="lg">
                  Procházet projekty
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg">
                  Registrace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16 sm:py-24 bg-orange-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-orange-600">Prozkoumejte naší platformu</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
             Všechno pro správu projektů na jednom místě
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
            Naše platforma poskytuje nástoje na kompletní správu projektů pro studenty i učitele s prezentací výsledných prací.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-y-10 gap-x-8 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                    <FileText color='white' size={32}></FileText>
                  </div>
                  Projektová dokumentace
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                Nahrajte a prezentujte kompletní projektovou dokumentaci, včetně rukopisů, plakátů a prezentací.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                    <Handshake color='white' size={32}></Handshake>
                  </div>
                  Spolupráce mezi učiteli a studenty
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                Učitelé mohou poskytovat strukturované vedení s milníky, konzultacemi a hodnoceními.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                    <ListChecks color='white' size={32}></ListChecks>
                  </div>
                  Sledování postupu
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                Sledujte pokrok projektu prostřednictvím definovaných milníků a vývojových fází pro lepší správu času.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                    <Speech color='white' size={32}></Speech>
                  </div>
                  Nástroje pro komunikaci
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                Zabudovaný komentářový systém pro zpětnou vazbu a diskuzi mezi studenty a učiteli o projektech.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-orange-600">
        <div className="px-6 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-white text-3xl font-bold tracking-tight sm:text-4xl ">
            Začněte se svými projekty již dnes
            </p>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-orange-100">
            Připojte se k naší platformě, kde můžete prezentovat svou práci, získat vedení od učitelů a spolupracovat s vrstevníky.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button variant="outline" size="lg" className="bg-white text-black hover:bg-orange-50">
                  Začínáme
                </Button>
              </Link>
              <Link href="/projects-public" className="p-3 rounded bg-white text-black hover:bg-orange-50">
                Procházejte projekty <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
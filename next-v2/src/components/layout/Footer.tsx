// src/components/layout/Footer.tsx
export default function Footer() {
    return (
      <footer className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold text-gray-900">Studentské projekty</h2>
              <p className="text-sm text-gray-600">
                Portál pro představení studenská projektů pro širokou veřejnost
              </p>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-8">
              <div className="mb-4 md:mb-0">
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Přehled</h3>
                <ul className="mt-2 space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900">O nás</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Kontakt</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Často kladené otázky</a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Ochrana informací</h3>
                <ul className="mt-2 space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Soukromí</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Podmínky uživání</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Studentské projekty, všechna práva vyhrazena
            </p>
          </div>
        </div>
      </footer>
    );
  }
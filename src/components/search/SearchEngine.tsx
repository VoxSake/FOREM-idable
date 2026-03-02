                {/* Search Action */}
                <Button
                    onClick={triggerSearch}
                    className="w-full lg:w-14 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white shrink-0 shadow-sm grid grid-cols-[20px_1fr_20px] items-center px-4 lg:flex lg:items-center lg:justify-center lg:px-0"
                >
                    <Search className="w-5 h-5" />
                    <span className="lg:hidden text-center font-medium">Rechercher</span>
                    <span className="w-5 h-5 lg:hidden" aria-hidden />
                </Button>
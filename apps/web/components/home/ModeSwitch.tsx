"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ModeSwitchProps = {
  showLanguage?: boolean;
  className?: string;
  label?: string;
};

function getMode(searchParams: URLSearchParams) {
  const mode = (searchParams.get("mode") || "").toLowerCase();
  return mode === "b2b" ? "b2b" : "b2c";
}

export function ModeSwitch({ showLanguage = false, className, label }: ModeSwitchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = getMode(searchParams);

  useEffect(() => {
    if (!searchParams.get("mode")) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("mode", "b2c");
      const hash = window.location.hash || "";
      router.replace(`${pathname}?${next.toString()}${hash}`);
    }
  }, [pathname, router, searchParams]);

  const setMode = useCallback(
    (nextMode: "b2c" | "b2b") => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("mode", nextMode);
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      router.replace(`${pathname}?${next.toString()}${hash}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {showLanguage && (
          <div>
            <label className="sr-only" htmlFor="lang-switcher">
              Langue
            </label>
            <select
              id="lang-switcher"
              className="h-10 cursor-pointer rounded-full border border-[#E6E6E6] bg-white px-4 text-sm font-semibold text-[#12130F]"
              defaultValue="fr"
              onChange={(event) => {
                const option = event.currentTarget.selectedOptions[0];
                const targetPath = option?.dataset?.url;
                if (!targetPath) return;
                const currentQuery = window.location.search;
                window.location.href = `${targetPath}${currentQuery}`;
              }}
            >
              <option value="fr" data-url="/">
                🇫🇷 FR
              </option>
              {/* TODO: activer lorsque /nl existe */}
              <option value="nl" data-url="/nl/" disabled>
                🇧🇪 NL
              </option>
            </select>
          </div>
        )}
        <div
          className="flex w-full max-w-[520px] items-center justify-center rounded-full border border-[#f0e6c7] bg-white p-2 shadow-[0_6px_18px_rgba(0,0,0,0.07)]"
          role="tablist"
          aria-label={label ?? "Choisir le public"}
        >
          <button
            type="button"
            role="tab"
            aria-pressed={mode === "b2c"}
            onClick={() => setMode("b2c")}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1950E]/60 ${
              mode === "b2c"
                ? "bg-gradient-to-r from-[#C1950E] to-[#e3c04a] text-[#14140f] shadow-[0_6px_16px_rgba(193,149,14,0.28)]"
                : "text-[#12130F]"
            }`}
          >
            Particuliers
          </button>
          <button
            type="button"
            role="tab"
            aria-pressed={mode === "b2b"}
            onClick={() => setMode("b2b")}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1950E]/60 ${
              mode === "b2b"
                ? "bg-[#CCCCCC] text-[#12130F] shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
                : "text-[#12130F]"
            }`}
          >
            Entreprises
          </button>
        </div>
      </div>
    </div>
  );
}

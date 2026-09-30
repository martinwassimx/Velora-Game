"use client";

import { useEffect, useState } from "react";

type InstallChoice = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const HIDE_KEY = "maro-install-hidden";

function standalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

function phone() {
  const agent = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(agent)) return true;
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return /android/i.test(agent) && /mobile/i.test(agent);
}

function iosDevice() {
  const agent = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallPrompt() {
  const [install, setInstall] = useState<InstallChoice | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    if (!phone() || standalone()) return;
    const hiddenUntil = Number(localStorage.getItem(HIDE_KEY) ?? 0);
    if (hiddenUntil > Date.now()) return;

    const onReady = (event: Event) => {
      event.preventDefault();
      setInstall(event as Event & InstallChoice);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onReady);
    const onInstalled = () => setOpen(false);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => {
      if (iosDevice()) {
        setIos(true);
        setOpen(true);
      }
    }, 1200);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function hide() {
    localStorage.setItem(HIDE_KEY, String(Date.now() + 1000 * 60 * 60 * 24 * 14));
    setOpen(false);
  }

  async function installApp() {
    if (!install) return;
    await install.prompt();
    const choice = await install.userChoice;
    setInstall(null);
    if (choice.outcome === "accepted") setOpen(false);
    else hide();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
      <section className="card w-full max-w-sm p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-amber-300" />
          <div>
            <p className="font-black">نزّل اللعبة</p>
            <p className="text-sm text-amber-100">حطّها على الشاشة الرئيسية وافتحها زي تطبيق.</p>
          </div>
        </div>
        {ios ? (
          <ol className="mt-3 space-y-1 text-sm leading-7 text-slate-200">
            <li>1. من سفاري اضغط زر المشاركة ⬆️</li>
            <li>2. اختار «إضافة إلى الشاشة الرئيسية»</li>
            <li>3. اضغط «إضافة»</li>
          </ol>
        ) : (
          <button className="btn btn-primary mt-3 w-full" onClick={installApp}>
            تثبيت التطبيق
          </button>
        )}
        <button className="btn btn-ghost mt-2 w-full" onClick={hide}>
          بعدين
        </button>
      </section>
    </div>
  );
}

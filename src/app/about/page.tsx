import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, Headphones, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/90 shadow-[0_50px_120px_-60px_rgba(15,23,42,0.35)] px-6 py-14 sm:px-10 sm:py-20 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="absolute inset-x-0 top-0 h-64 bg-linear-to-r from-primary/10 via-primary/5 to-primary/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">About Aura Jewels</p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl">
            We bring the finest luxury jewelry to your door.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            Aura Jewels is your trusted online destination for exclusive jewelry collections, timeless designs, and bespoke customer support. We combine secure shipping, authentic precious metals, and unparalleled craftsmanship so you can shop for elegance with confidence.
          </p>
        </div>
      </div>

      <section className="mx-auto mt-14 max-w-6xl space-y-12">
        <div className="grid gap-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 md:grid-cols-[1.2fr_0.8fr] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary">Our mission</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 dark:text-slate-50 sm:text-4xl">Helping every shopper find the perfect statement piece.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
              We believe luxury jewelry should be accessible, exquisite, and easy to acquire. That means offering verified diamonds, transparent pricing, expert styling advice, and secure delivery that makes every unboxing an event.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-primary/10 p-8 text-slate-950 shadow-inner dark:bg-primary/5 dark:text-slate-100">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-slate-800">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <p className="mt-6 text-base leading-7 text-slate-700 dark:text-slate-300">
              From breathtaking engagement rings to classic daily wear, we curate every piece with brilliance and legacy in mind. Our team honors traditional artistry while embracing modern trends so you can shop confidently for heirloom-quality pieces.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-slate-50">Verified Authenticity</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Every item is crafted with genuine materials and conflict-free stones, ensuring you receive authentic luxury with complete peace of mind.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
              <Truck className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-slate-50">Secure & Insured Delivery</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              We ship quickly, discreetly, and securely so your precious pieces arrive safely, on time, and in signature elegant packaging.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
              <Headphones className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-slate-50">Concierge Support</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Our dedicated jewelry consultants are available to guide you, recommend styles, and assist you with bespoke requests.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-linear-to-r from-primary/90 via-primary to-primary/90 px-8 py-12 text-center text-primary-foreground shadow-xl dark:border-slate-800">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary-foreground/80">Shop with confidence</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Discover your next timeless piece today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-primary-foreground/90 sm:text-lg">
            Browse our full collection of rings, necklaces, earrings, and bracelets — all backed by insured shipping and expert craftsmanship.
          </p>
          <Link href="/shop" className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100 dark:bg-slate-100/90 dark:text-slate-950 dark:hover:bg-slate-200">
            Explore the Collection
          </Link>
        </div>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import heroCity from "@/assets/hero-city.jpg";

const HeroSection = () => {
  return (
    <section className="relative mt-20 flex min-h-[calc(100svh-5rem)] items-end">
      <img
        src={heroCity}
        alt="A concrete architectural model of the City of Caerhold"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />

      <div className="relative z-10 w-full section-padding pb-12 pt-28 md:pb-20 md:pt-32">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.28em] text-accent">
            Studio Assembly
          </p>
          <h1 className="mb-6 text-4xl font-bold uppercase leading-[1.05] tracking-wider text-white md:text-6xl lg:text-7xl">
            The City of Caerhold
          </h1>
          <p className="mb-10 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            A city you can walk. The kits are its buildings: a supermarket on the corner, apartments above the street.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/caerhold" className="btn-gold inline-block text-center text-sm">
              Enter the city
            </Link>
            <Link
              to="/shop"
              className="inline-block border border-white px-8 py-4 text-center text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
            >
              The collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

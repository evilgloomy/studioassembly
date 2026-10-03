import { Link } from "react-router-dom";
import cityWireframe from "@/assets/city-wireframe.jpg";
import botanicalLeft from "@/assets/botanical-left.png";
import botanicalRight from "@/assets/botanical-right.png";

const entries = [
  {
    index: "01",
    title: "Explore the city",
    description:
      "Caerhold has districts, a map, and streets that connect. Begin with the city, then follow a block.",
    links: [
      { label: "The city", to: "/caerhold" },
      { label: "Districts", to: "/caerhold/districts" },
      { label: "Map", to: "/caerhold/map" },
    ],
  },
  {
    index: "02",
    title: "Meet the residents",
    description:
      "People live in these buildings. Read who they are before you decide which corner to build.",
    links: [{ label: "Residents", to: "/caerhold/residents" }],
  },
  {
    index: "03",
    title: "The collection as buildings",
    description:
      "The kits are not a lineup of objects. They are places already standing in Caerhold.",
    links: [{ label: "The collection", to: "/shop" }],
  },
];

const FeatureGrid = () => {
  return (
    <section className="relative overflow-hidden border-t border-primary section-padding py-20 md:py-28">
      <img
        src={botanicalLeft}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-6 hidden w-48 opacity-40 sm:block md:w-64"
      />
      <img
        src={botanicalRight}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-0 hidden w-44 opacity-30 sm:block md:w-60"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              A short introduction
            </p>
            <h2 className="mb-6 text-2xl font-bold uppercase tracking-widest md:text-3xl">
              Caerhold is where the kits live
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground md:text-base">
              Studio Assembly designs architectural construction kits. They belong to one city: rooms, shops, and floors someone might actually keep.
            </p>
            <img
              src={cityWireframe}
              alt="Line drawing of the City of Caerhold"
              className="h-auto w-full"
            />
          </div>

          <div className="border-y border-primary lg:col-span-7">
            {entries.map((entry) => (
              <article key={entry.index} className="border-b border-primary py-8 last:border-b-0">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  {entry.index}
                </p>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest">
                  {entry.title}
                </h3>
                <p className="mb-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {entry.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-sm font-medium uppercase tracking-wider underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;

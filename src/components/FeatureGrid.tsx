import { Ruler, Palette, Diamond } from "lucide-react";

const features = [
  {
    icon: Ruler,
    title: "Precision Scale",
    description: "Every model built to exact architectural proportions for authentic display.",
  },
  {
    icon: Palette,
    title: "Curated Design",
    description: "Thoughtfully designed kits that balance complexity with buildability.",
  },
  {
    icon: Diamond,
    title: "Premium Parts",
    description: "High-quality components sourced for durability and visual excellence.",
  },
];

const FeatureGrid = () => {
  return (
    <section className="section-padding py-24 border-t border-primary">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`p-8 md:p-12 text-center ${
                index < features.length - 1 ? "md:border-r border-primary" : ""
              } ${index > 0 ? "border-t md:border-t-0 border-primary" : ""}`}
            >
              <feature.icon 
                size={32} 
                strokeWidth={1} 
                className="mx-auto mb-6 text-foreground"
              />
              <h3 className="text-sm font-semibold tracking-widest uppercase mb-4">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
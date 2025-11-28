import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@finsight/ui/card";

export function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="bg-background text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-lg border transition-colors">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

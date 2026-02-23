import Image from "next/image";

interface ForemIdableLogoProps {
  className?: string;
}

export function ForemIdableLogo({ className }: ForemIdableLogoProps) {
  return (
    <div className={className}>
      <Image
        src="/forem-idable-logo-light.svg"
        alt="FOREM-idable"
        width={156}
        height={28}
        className="h-full w-auto block dark:hidden"
        priority
      />
      <Image
        src="/forem-idable-logo-dark.svg"
        alt="FOREM-idable"
        width={156}
        height={28}
        className="h-full w-auto hidden dark:block"
        priority
      />
    </div>
  );
}

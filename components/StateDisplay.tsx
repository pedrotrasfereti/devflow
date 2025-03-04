import Image from "next/image";
import Link from "next/link";

import { Button } from "./ui/button";

interface StateDisplayProps {
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  title: string;
  message: string;
  button?: {
    text: string;
    href: string;
  };
}

const StateDisplay = ({ image, title, message, button }: StateDisplayProps) => {
  return (
    <div className="mt-16 flex w-full flex-col items-center justify-center sm:mt-36">
      <>
        <Image
          src={image.dark}
          alt={image.alt}
          width={270}
          height={200}
          className="hidden object-contain dark:block"
        />

        <Image
          src={image.light}
          alt={image.alt}
          width={270}
          height={200}
          className="block object-contain dark:hidden"
        />

        <h2 className="h2-bold text-dark200_light900 mt-8">{title}</h2>

        <p className="body-regular text-dark500_light700 my-3.5 max-w-md text-center">
          {message}
        </p>

        {button && (
          <Link href={button.href}>
            <Button className="paragraph-medium mt-5 min-h-[46px] rounded-lg bg-primary-500 px-4 py-3 text-light-900 hover:bg-primary-500">
              {button.text}
            </Button>
          </Link>
        )}
      </>
    </div>
  );
};

export default StateDisplay;

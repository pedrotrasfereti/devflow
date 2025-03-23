import { DEFAULT_EMPTY, DEFAULT_ERROR } from "@/constants/ui-states";

import StateDisplay from "./StateDisplay";

interface Props<T> {
  success: boolean;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
  data: T[] | null | undefined;
  empty: {
    title: string;
    message: string;
    button?: {
      text: string;
      href: string;
    };
  };
  render: (data: T[]) => React.ReactNode;
}

const DataRenderer = <T,>({
  success,
  error,
  data,
  empty = DEFAULT_EMPTY,
  render,
}: Props<T>) => {
  // Error State
  if (!success) {
    return (
      <StateDisplay
        image={{
          light: "/images/light-error.png",
          dark: "/images/dark-error.png",
          alt: "Error illustration",
        }}
        title={error?.message || DEFAULT_ERROR.title}
        message={
          error?.details
            ? JSON.stringify(error.details, null, 2)
            : DEFAULT_ERROR.message
        }
        button={DEFAULT_ERROR.button}
      />
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
      <StateDisplay
        image={{
          light: "/images/light-illustration.png",
          dark: "/images/dark-illustration.png",
          alt: "Empty state illustration",
        }}
        title={empty.title}
        message={empty.message}
        button={empty.button}
      />
    );
  }

  // Expected Content/Data
  return <div>{render(data)}</div>;
};

export default DataRenderer;

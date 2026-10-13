
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Button from "../../src/components/ui/Button";

afterEach(() => {
  cleanup();
});

describe("Button", () => {
  it("renders its label and handles clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button onClick={onClick}>
        Create order
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "Create order",
    });

    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables interaction while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Submit order
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "Submit order",
    });

    expect(button).toBeDisabled();

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});

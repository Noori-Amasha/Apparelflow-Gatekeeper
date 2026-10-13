
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import LoginForm from "../../src/features/auth/components/LoginForm";

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
}));

vi.mock("../../src/app/providers/AuthProvider", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock("../../src/lib/api", () => ({
  apiError: (error: unknown) =>
    error instanceof Error
      ? error.message
      : "Something went wrong",
}));

describe("LoginForm", () => {
  beforeEach(() => {
    cleanup();
    mockLogin.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the login form", () => {
    render(<LoginForm onSuccess={vi.fn()} />);

    expect(
      screen.getByLabelText("Work email"),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Sign in to workspace",
      }),
    ).toBeInTheDocument();
  });

  it("rejects empty login fields", async () => {
    const user = userEvent.setup();

    render(<LoginForm onSuccess={vi.fn()} />);

    await user.click(
      screen.getByRole("button", {
        name: "Sign in to workspace",
      }),
    );

    expect(
      await screen.findByText(
        "Enter a valid email address",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Password is required"),
    ).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(<LoginForm onSuccess={vi.fn()} />);

    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute(
      "type",
      "password",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Show password",
      }),
    );

    expect(password).toHaveAttribute(
      "type",
      "text",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Hide password",
      }),
    );

    expect(password).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("logs in successfully and returns the user role", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    mockLogin.mockResolvedValue({
      id: "user-1",
      email: "verifier@example.com",
      role: "cutting_verifier",
    });

    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(
      screen.getByLabelText("Work email"),
      "verifier@example.com",
    );

    await user.type(
      screen.getByLabelText("Password"),
      "Password123!",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Sign in to workspace",
      }),
    );

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "verifier@example.com",
        "Password123!",
      );

      expect(onSuccess).toHaveBeenCalledWith(
        "cutting_verifier",
      );
    });
  });

  it("displays an authentication error", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    mockLogin.mockRejectedValue(
      new Error("Invalid email or password"),
    );

    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(
      screen.getByLabelText("Work email"),
      "wrong@example.com",
    );

    await user.type(
      screen.getByLabelText("Password"),
      "WrongPassword",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Sign in to workspace",
      }),
    );

    expect(
      await screen.findByText(
        "Invalid email or password",
      ),
    ).toBeInTheDocument();

    expect(onSuccess).not.toHaveBeenCalled();
  });
});

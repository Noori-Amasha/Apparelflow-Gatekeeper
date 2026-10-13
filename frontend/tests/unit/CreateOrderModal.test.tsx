import {
  afterEach,
  beforeEach,
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

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import CreateOrderModal from "../../src/features/cutting/components/CreateOrderModal";

const {
  mockRecipes,
  mockRecipe,
  mockCreate,
  mockNotify,
} = vi.hoisted(() => ({
  mockRecipes: vi.fn(),
  mockRecipe: vi.fn(),
  mockCreate: vi.fn(),
  mockNotify: vi.fn(),
}));

vi.mock("../../src/features/cutting/api/cutting.api", () => ({
  cuttingApi: {
    recipes: mockRecipes,
    recipe: mockRecipe,
    create: mockCreate,
  },
}));

vi.mock("../../src/app/providers/ToastProvider", () => ({
  useToast: () => ({
    notify: mockNotify,
  }),
}));

const recipeId = "11111111-1111-4111-8111-111111111111";

const recipe = {
  id: recipeId,
  recipe_code: "REC-BL01",
  name: "Casual Blouse",
  category: "Blouse",
  std_fabric_yards: 1.8,
  wastage_cap: 5,
  components: [
    {
      id: "component-1",
      recipe_id: recipeId,
      component_name: "Front Panel",
      pieces_per_garment: 1,
      image_url: null,
    },
  ],
};

function renderModal(close = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <CreateOrderModal open close={close} />
    </QueryClientProvider>,
  );

  return { close };
}

describe("CreateOrderModal", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    mockRecipes.mockResolvedValue([recipe]);
    mockRecipe.mockResolvedValue(recipe);
    mockCreate.mockResolvedValue({
      id: "order-1",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the cutting order form", async () => {
    renderModal();

    expect(
      screen.getByRole("dialog", {
        name: "Create Cutting Order",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Target Quantity"),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Actual Fabric Used (yards)"),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Fabric Roll ID"),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("option", {
        name: "Casual Blouse (REC-BL01)",
      }),
    ).toBeInTheDocument();
  });

  it("calculates expected fabric from recipe and quantity", async () => {
    const user = userEvent.setup();

    renderModal();

    // Wait for React Query to load recipe options.
    await screen.findByRole("option", {
      name: "Casual Blouse (REC-BL01)",
    });

    await user.selectOptions(
      screen.getByLabelText("Production Recipe"),
      recipeId,
    );

    // Wait for selected recipe details.
    expect(
      await screen.findByText("1.80 yards"),
    ).toBeInTheDocument();

    const quantityInput =
      screen.getByLabelText("Target Quantity");

    await user.clear(quantityInput);
    await user.type(quantityInput, "20");

    // 1.8 yards x 20 garments = 36 yards.
    expect(
      await screen.findByText("36.00 yards"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Front Panel"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("20", {
        selector: "strong",
      }),
    ).toBeInTheDocument();

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates an order with valid production values", async () => {
    const user = userEvent.setup();
    const close = vi.fn();

    renderModal(close);

    // Ensure the recipe is available before selecting.
    await screen.findByRole("option", {
      name: "Casual Blouse (REC-BL01)",
    });

    await user.selectOptions(
      screen.getByLabelText("Production Recipe"),
      recipeId,
    );

    // Wait for recipe details.
    expect(
      await screen.findByText("Expected Production"),
    ).toBeInTheDocument();

    const quantityInput =
      screen.getByLabelText("Target Quantity");

    await user.clear(quantityInput);
    await user.type(quantityInput, "20");

    await user.type(
      screen.getByLabelText("Actual Fabric Used (yards)"),
      "36",
    );

    await user.type(
      screen.getByLabelText("Fabric Roll ID"),
      "FAB-ROLL-882",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create Order",
      }),
    );

    // React Query passes mutation variables and an additional context.
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        {
          recipe_id: recipeId,
          target_qty: 20,
          fabric_roll_id: "FAB-ROLL-882",
          actual_fabric_yds: 36,
        },
        expect.anything(),
      );
    });

    await waitFor(() => {
      expect(close).toHaveBeenCalledOnce();
    });

    expect(mockNotify).toHaveBeenCalledWith(
      "Cutting order created successfully",
      "success",
    );
  });
});

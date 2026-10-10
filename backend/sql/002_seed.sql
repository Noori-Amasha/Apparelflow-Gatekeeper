
INSERT INTO recipes (
    recipe_code,
    name,
    category,
    std_fabric_yards,
    wastage_cap
)
VALUES (
    'REC-BL01',
    'Casual Blouse',
    'Blouse',
    1.800,
    5.00
)
ON CONFLICT (recipe_code) DO NOTHING;


-- CASUAL BLOUSE COMPONENTS

INSERT INTO recipe_components (
    recipe_id,
    component_name,
    pieces_per_garment,
    image_url
)
SELECT
    r.id,
    c.component_name,
    c.pieces_per_garment,
    NULL
FROM recipes r
CROSS JOIN (
    VALUES
        ('Front Body Panel', 1),
        ('Back Body Panel', 1),
        ('Sleeves (Left & Right)', 2),
        ('Collar & Stand', 1),
        ('Sleeve Cuffs', 2)
) AS c(component_name, pieces_per_garment)
WHERE r.recipe_code = 'REC-BL01'
ON CONFLICT (recipe_id, component_name) DO NOTHING;

INSERT INTO recipes (
    recipe_code,
    name,
    category,
    std_fabric_yards,
    wastage_cap
)
VALUES (
    'REC-CT02',
    'Crop Top',
    'Crop Top',
    1.100,
    8.00
)
ON CONFLICT (recipe_code) DO NOTHING;


-- CROP TOP COMPONENTS

INSERT INTO recipe_components (
    recipe_id,
    component_name,
    pieces_per_garment,
    image_url
)
SELECT
    r.id,
    c.component_name,
    c.pieces_per_garment,
    NULL
FROM recipes r
CROSS JOIN (
    VALUES
        ('Front Chest Panel', 1),
        ('Back Support Panel', 1),
        ('Neck Binding Strip', 1),
        ('Hem Elastic Casing', 1),
        ('Side Strap Accents', 2)
) AS c(component_name, pieces_per_garment)
WHERE r.recipe_code = 'REC-CT02'
ON CONFLICT (recipe_id, component_name) DO NOTHING;

SELECT
    r.recipe_code,
    r.name,
    r.category,
    r.std_fabric_yards,
    r.wastage_cap,
    c.component_name,
    c.pieces_per_garment
FROM recipes r
JOIN recipe_components c
    ON c.recipe_id = r.id
WHERE r.recipe_code IN ('REC-BL01', 'REC-CT02')
ORDER BY
    r.recipe_code,
    c.component_name;

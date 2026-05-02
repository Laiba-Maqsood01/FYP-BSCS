import car1 from "../src/assets/car1.jpg";
import car2 from "../src/assets/car2.png";
import car3 from "../src/assets/car3.jpg";
import car4 from "../src/assets/car4.jpg";
import car5 from "../src/assets/car5.jpg";

const CURRENT_USER_KEY = "autohub-current-user";
const DATABASE_KEY = "autohub-local-db";

const DEFAULT_USERS = [
  {
    id: "user-admin",
    fullName: "Admin User",
    email: "admin@autohub.com",
    phone: "+92 300 0000000",
    password: "123456",
    role: "admin",
    location: "Rahim Yar Khan",
    accountType: "seller",
    status: "active",
    joinedAt: "2023-12-10T09:00:00.000Z",
  },
];

const DEFAULT_LISTINGS = [
  {
    id: "listing-1",
    name: "Toyota Corolla GLi 1.3 VVTi",
    model: "Corolla",
    year: "2022",
    fuel: "Petrol",
    price: "Rs 4,250,000",
    priceValue: 4250000,
    mileage: "28,000 km",
    location: "Rahim Yar Khan",
    image: "/src/assets/car2.png",
    featured: true,
    status: "inspected",
    ownerId: "user-admin",
  },
  {
    id: "listing-2",
    name: "Honda Civic Oriel 1.8 i-VTEC",
    model: "Civic",
    year: "2021",
    fuel: "Petrol",
    price: "Rs 6,500,000",
    priceValue: 6500000,
    mileage: "35,000 km",
    location: "Lahore",
    image: "/src/assets/car3.jpg",
    featured: true,
    status: "inspected",
    ownerId: "user-admin",
  },
  {
    id: "listing-3",
    name: "Suzuki Alto VXR AGS",
    model: "Alto",
    year: "2023",
    fuel: "Petrol",
    price: "Rs 2,100,000",
    priceValue: 2100000,
    mileage: "12,000 km",
    location: "Karachi",
    image: "/src/assets/car1.jpg",
    featured: false,
    status: "pending",
    ownerId: "user-admin",
  },
  {
    id: "listing-4",
    name: "Toyota Fortuner 2.7 VVTi",
    model: "Fortuner",
    year: "2020",
    fuel: "Petrol",
    price: "Rs 12,500,000",
    priceValue: 12500000,
    mileage: "55,000 km",
    location: "Islamabad",
    image: "/src/assets/car4.jpg",
    featured: true,
    status: "inspected",
    ownerId: "user-admin",
  },
  {
    id: "listing-5",
    name: "Hyundai Tucson",
    model: "Tucson",
    year: "2022",
    fuel: "Petrol",
    price: "Rs 7,850,000",
    priceValue: 7850000,
    mileage: "18,500 km",
    location: "Multan",
    image: "/src/assets/car5.jpg",
    featured: false,
    status: "pending",
    ownerId: "user-admin",
  },
];

const DEFAULT_INSPECTIONS = [
  {
    id: "inspection-1",
    listingId: "listing-1",
    ownerId: "user-admin",
    status: "completed",
    inspector: "Ali",
    scheduledAt: "2026-03-25T09:00:00.000Z",
    notes: "Verified engine, suspension, and body condition.",
    reportOpinion: "The car is mechanically healthy with only minor cosmetic wear.",
    reportFileName: "corolla-inspection-report.pdf",
    partImages: {
      "Engine performance": ["/src/assets/car2.png", "/src/assets/car5.jpg"],
      "Transmission response": ["/src/assets/car2.png"],
      "Fluid leakage check": ["/src/assets/car5.jpg"],
      "Body panels": ["/src/assets/car2.png", "/src/assets/car4.jpg"],
      "Paint condition": ["/src/assets/car4.jpg"],
      "Lights & visibility": ["/src/assets/car2.png"],
      "Cabin condition": ["/src/assets/car3.jpg", "/src/assets/car5.jpg"],
      "Mileage consistency": ["/src/assets/car3.jpg"],
      "Overall recommendation": ["/src/assets/car2.png", "/src/assets/car3.jpg"],
    },
  },
  {
    id: "inspection-2",
    listingId: "listing-2",
    ownerId: "user-admin",
    status: "completed",
    inspector: "Sara",
    scheduledAt: "2026-03-26T09:00:00.000Z",
    notes: "Detailed inspection completed successfully.",
    reportOpinion: "A well-maintained sedan with clean driving behavior and solid cabin condition.",
    reportFileName: "civic-condition-report.pdf",
    partImages: {
      "Engine performance": ["/src/assets/car3.jpg", "/src/assets/car5.jpg"],
      "Transmission response": ["/src/assets/car3.jpg"],
      "Fluid leakage check": ["/src/assets/car5.jpg"],
      "Body panels": ["/src/assets/car3.jpg", "/src/assets/car4.jpg"],
      "Paint condition": ["/src/assets/car4.jpg"],
      "Lights & visibility": ["/src/assets/car3.jpg"],
      "Cabin condition": ["/src/assets/car2.png", "/src/assets/car5.jpg"],
      "Mileage consistency": ["/src/assets/car2.png"],
      "Overall recommendation": ["/src/assets/car3.jpg", "/src/assets/car2.png"],
    },
  },
  {
    id: "inspection-3",
    listingId: "listing-3",
    ownerId: "user-admin",
    status: "pending",
    inspector: "Assigned Inspector",
    scheduledAt: "2026-03-26T11:30:00.000Z",
    notes: "Waiting for seller confirmation.",
  },
  {
    id: "inspection-4",
    listingId: "listing-4",
    ownerId: "user-admin",
    status: "completed",
    inspector: "Ali",
    scheduledAt: "2026-03-27T08:15:00.000Z",
    notes: "Vehicle passed all core inspection points.",
    partImages: {
      "Engine performance": ["/src/assets/car4.jpg", "/src/assets/car5.jpg"],
      "Transmission response": ["/src/assets/car4.jpg"],
      "Fluid leakage check": ["/src/assets/car5.jpg"],
      "Body panels": ["/src/assets/car4.jpg", "/src/assets/car2.png"],
      "Paint condition": ["/src/assets/car4.jpg"],
      "Lights & visibility": ["/src/assets/car4.jpg"],
      "Cabin condition": ["/src/assets/car3.jpg", "/src/assets/car5.jpg"],
      "Mileage consistency": ["/src/assets/car3.jpg"],
      "Overall recommendation": ["/src/assets/car4.jpg", "/src/assets/car3.jpg"],
    },
  },
];

const assetMap = {
  "/src/assets/car1.jpg": car1,
  "/src/assets/car2.png": car2,
  "/src/assets/car3.jpg": car3,
  "/src/assets/car4.jpg": car4,
  "/src/assets/car5.jpg": car5,
};

function delay(value) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 120);
  });
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function priceToNumber(price) {
  return Number(String(price || "").replace(/[^\d]/g, "")) || 0;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveAsset(source) {
  return assetMap[source] || source || car2;
}

function createPartImages(sourceImage) {
  const primaryImage = resolveAsset(sourceImage);

  return {
    "Engine performance": [primaryImage, car5],
    "Transmission response": [primaryImage],
    "Fluid leakage check": [car5],
    "Body panels": [primaryImage, car4],
    "Paint condition": [car4],
    "Lights & visibility": [primaryImage],
    "Cabin condition": [car3, car5],
    "Mileage consistency": [car3],
    "Overall recommendation": [primaryImage, car3],
  };
}

function seedDatabase() {
  return {
    users: clone(DEFAULT_USERS),
    listings: clone(DEFAULT_LISTINGS),
    inspections: clone(DEFAULT_INSPECTIONS),
  };
}

function readDatabase() {
  const raw = localStorage.getItem(DATABASE_KEY);

  if (!raw) {
    const seeded = seedDatabase();
    localStorage.setItem(DATABASE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    const database = {
      users: parsed.users || [],
      listings: parsed.listings || [],
      inspections: parsed.inspections || [],
    };

    database.users = database.users
      .filter((user) => user.email !== "user@example.com")
      .map((user) => {
        if (user.email === "admin@autohub.com") {
          return {
            ...user,
            password: "123456",
            status: user.status || "active",
            joinedAt: user.joinedAt || "2023-12-10T09:00:00.000Z",
          };
        }

        return {
          ...user,
          status: user.status || "active",
          joinedAt: user.joinedAt || new Date().toISOString(),
        };
      });

    DEFAULT_LISTINGS.forEach((defaultListing) => {
      const alreadyExists = database.listings.some(
        (listing) => listing.id === defaultListing.id,
      );

      if (!alreadyExists) {
        database.listings.push(clone(defaultListing));
      }
    });

    database.inspections = database.inspections.map((inspection) => {
      const relatedListing = database.listings.find(
        (listing) => listing.id === inspection.listingId,
      );

      return {
        ...inspection,
        partImages:
          inspection.partImages ||
          createPartImages(relatedListing?.image || "/src/assets/car2.png"),
      };
    });

    localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
    return database;
  } catch {
    const seeded = seedDatabase();
    localStorage.setItem(DATABASE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeDatabase(database) {
  localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
  return database;
}

function withoutPassword(user) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function normalizeListing(listing, database) {
  const owner = database.users.find((user) => user.id === listing.ownerId);
  const completedInspection = database.inspections
    .filter(
      (inspection) =>
        inspection.listingId === listing.id && inspection.status === "completed",
    )
    .sort(
      (left, right) =>
        new Date(right.scheduledAt || 0).getTime() -
        new Date(left.scheduledAt || 0).getTime(),
    )[0];
  const inspectionPartImages = completedInspection?.partImages || createPartImages(listing.image);

  return {
    id: listing.id,
    name: listing.name,
    model: listing.model,
    year: listing.year,
    fuel: listing.fuel,
    price: listing.price,
    priceValue: listing.priceValue,
    mileage: listing.mileage,
    location: listing.location,
    image: resolveAsset(listing.image),
    featured: Boolean(listing.featured),
    status: listing.status,
    owner: owner
      ? {
          id: owner.id,
          fullName: owner.fullName,
          email: owner.email,
        }
      : null,
    inspection: completedInspection
      ? {
          id: completedInspection.id,
          status: completedInspection.status,
          inspector: completedInspection.inspector,
          scheduledAt: completedInspection.scheduledAt,
          notes: completedInspection.notes || "",
          reportOpinion: completedInspection.reportOpinion || "",
          reportFileName: completedInspection.reportFileName || "",
          partImages: Object.fromEntries(
            Object.entries(inspectionPartImages).map(
              ([partName, imageList]) => [
                partName,
                (imageList || []).map((imageSource) => resolveAsset(imageSource)),
              ],
            ),
          ),
        }
      : null,
  };
}

function normalizeInspection(inspection, database) {
  const listing = database.listings.find((item) => item.id === inspection.listingId);

  return {
    id: inspection.id,
    status: inspection.status,
    inspector: inspection.inspector,
    scheduledAt: inspection.scheduledAt,
    notes: inspection.notes,
    reportOpinion: inspection.reportOpinion || "",
    reportFileName: inspection.reportFileName || "",
    listing: listing ? normalizeListing(listing, database) : null,
  };
}

function syncListingStatus(database, listingId) {
  const listing = database.listings.find((item) => item.id === listingId);

  if (!listing) {
    return;
  }

  const hasCompletedInspection = database.inspections.some(
    (inspection) =>
      inspection.listingId === listingId && inspection.status === "completed",
  );

  listing.status = hasCompletedInspection ? "inspected" : "pending";
}

export function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function registerUser(payload) {
  const database = readDatabase();
  const email = sanitizeEmail(payload.email);

  if (!payload.fullName || !email || !payload.password) {
    throw new Error("Full name, email, and password are required.");
  }

  const existingUser = database.users.find((user) => user.email === email);
  if (existingUser) {
    throw new Error("Email is already registered.");
  }

  const user = {
    id: generateId("user"),
    fullName: payload.fullName.trim(),
    email,
    phone: payload.phone || "",
    password: "123456",
    role: email === "admin@autohub.com" ? "admin" : "user",
    location: payload.location || "Pakistan",
    accountType: payload.accountType || "buyer",
    status: "active",
    joinedAt: new Date().toISOString(),
  };

  database.users.unshift(user);
  writeDatabase(database);

  const safeUser = withoutPassword(user);
  setCurrentUser(safeUser);

  return delay(safeUser);
}

export async function createUserByAdmin(payload) {
  const database = readDatabase();
  const email = sanitizeEmail(payload.email);

  if (!payload.fullName || !email) {
    throw new Error("Full name and email are required.");
  }

  const existingUser = database.users.find((user) => user.email === email);
  if (existingUser) {
    throw new Error("Email is already registered.");
  }

  const role = payload.role || "user";
  const accountType =
    role === "admin" ? "seller" : payload.accountType || "buyer";

  const user = {
    id: generateId("user"),
    fullName: payload.fullName.trim(),
    email,
    phone: payload.phone || "",
    password: payload.password || "123456",
    role,
    location: payload.location || "Pakistan",
    accountType,
    status: payload.status || "active",
    joinedAt: new Date().toISOString(),
  };

  database.users.unshift(user);
  writeDatabase(database);

  return delay(withoutPassword(user));
}

export async function loginUser(payload) {
  const database = readDatabase();
  const email = sanitizeEmail(payload.email);

  if (!email || !payload.password) {
    throw new Error("Email and password are required.");
  }

  const user = database.users.find(
    (item) => item.email === email && item.password === payload.password,
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const safeUser = withoutPassword(user);
  setCurrentUser(safeUser);

  return delay(safeUser);
}

export async function getListings() {
  const database = readDatabase();
  const listings = database.listings
    .slice()
    .sort((left, right) => right.priceValue - left.priceValue)
    .map((listing) => normalizeListing(listing, database));

  return delay(listings);
}

export async function getFeaturedListings() {
  const database = readDatabase();
  const listings = database.listings
    .filter((listing) => listing.featured)
    .map((listing) => normalizeListing(listing, database));

  return delay(listings);
}

export async function getUserListings(userId) {
  const database = readDatabase();
  const listings = database.listings
    .filter((listing) => listing.ownerId === userId)
    .map((listing) => normalizeListing(listing, database));

  return delay(listings);
}

export async function getListingById(listingId) {
  const database = readDatabase();
  const listing = database.listings.find((item) => item.id === listingId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  return delay(normalizeListing(listing, database));
}

export async function createListing(payload) {
  const database = readDatabase();

  if (!payload.ownerId) {
    throw new Error("ownerId is required.");
  }

  const owner = database.users.find((user) => user.id === payload.ownerId);
  if (!owner) {
    throw new Error("Owner not found.");
  }

  const requiredFields = [
    "name",
    "model",
    "year",
    "fuel",
    "price",
    "mileage",
    "location",
    "image",
  ];

  const missingField = requiredFields.find((field) => !payload[field]);
  if (missingField) {
    throw new Error("Please fill in all listing fields.");
  }

  const listing = {
    id: generateId("listing"),
    name: payload.name,
    model: payload.model,
    year: payload.year,
    fuel: payload.fuel,
    price: payload.price,
    priceValue: priceToNumber(payload.price),
    mileage: payload.mileage,
    location: payload.location,
    image: payload.image,
    featured: false,
    status: "pending",
    ownerId: owner.id,
  };

  database.listings.unshift(listing);
  writeDatabase(database);

  return delay(normalizeListing(listing, database));
}

export async function createSellInquiry(payload) {
  const requiredFields = ["name", "model", "year", "fuel", "price", "mileage", "location", "image"];
  const missingField = requiredFields.find((field) => !payload[field]);

  if (missingField) {
    throw new Error("Please fill in all listing fields.");
  }

  const existingLeads = JSON.parse(
    localStorage.getItem("autohub-sell-inquiries") || "[]",
  );

  existingLeads.unshift({
    id: generateId("sell"),
    ...payload,
    submittedAt: new Date().toISOString(),
  });

  localStorage.setItem("autohub-sell-inquiries", JSON.stringify(existingLeads));

  return delay(existingLeads[0]);
}

export async function updateListing(listingId, payload) {
  const database = readDatabase();
  const listing = database.listings.find((item) => item.id === listingId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  const nextImage = payload.image || listing.image;

  Object.assign(listing, {
    name: payload.name ?? listing.name,
    model: payload.model ?? listing.model,
    year: payload.year ?? listing.year,
    fuel: payload.fuel ?? listing.fuel,
    price: payload.price ?? listing.price,
    priceValue: payload.price ? priceToNumber(payload.price) : listing.priceValue,
    mileage: payload.mileage ?? listing.mileage,
    location: payload.location ?? listing.location,
    image: nextImage,
  });

  writeDatabase(database);

  return delay(normalizeListing(listing, database));
}

export async function deleteListing(listingId) {
  const database = readDatabase();
  const listingIndex = database.listings.findIndex((item) => item.id === listingId);

  if (listingIndex === -1) {
    throw new Error("Listing not found.");
  }

  database.listings.splice(listingIndex, 1);
  database.inspections = database.inspections.filter(
    (inspection) => inspection.listingId !== listingId,
  );
  writeDatabase(database);

  return delay({ success: true });
}

export async function updateListingFeatured(listingId, featured) {
  const database = readDatabase();
  const listing = database.listings.find((item) => item.id === listingId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  listing.featured = Boolean(featured);
  writeDatabase(database);

  return delay(normalizeListing(listing, database));
}

export async function getUserInspections(userId) {
  const database = readDatabase();
  const inspections = database.inspections
    .filter((inspection) => inspection.ownerId === userId)
    .map((inspection) => normalizeInspection(inspection, database));

  return delay(inspections);
}

export async function getInspections() {
  const database = readDatabase();
  const inspections = database.inspections.map((inspection) =>
    normalizeInspection(inspection, database),
  );

  return delay(inspections);
}

export async function createInspection(payload) {
  const database = readDatabase();
  const listing = database.listings.find((item) => item.id === payload.listingId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  const inspection = {
    id: generateId("inspection"),
    listingId: listing.id,
    ownerId: payload.ownerId || listing.ownerId,
    status: "pending",
    inspector: payload.inspector || "Assigned Inspector",
    scheduledAt: payload.scheduledAt || new Date().toISOString(),
    notes: payload.notes || "",
    reportOpinion: payload.reportOpinion || "",
    reportFileName: payload.reportFileName || "",
  };

  database.inspections.unshift(inspection);
  syncListingStatus(database, listing.id);
  writeDatabase(database);

  return delay(normalizeInspection(inspection, database));
}

export async function updateInspection(inspectionId, payload) {
  const database = readDatabase();
  const inspection = database.inspections.find((item) => item.id === inspectionId);

  if (!inspection) {
    throw new Error("Inspection not found.");
  }

  if (payload.status) {
    inspection.status = payload.status;
  }

  if (payload.inspector) {
    inspection.inspector = payload.inspector;
  }

  if (payload.notes !== undefined) {
    inspection.notes = payload.notes;
  }

  if (payload.reportOpinion !== undefined) {
    inspection.reportOpinion = payload.reportOpinion;
  }

  if (payload.reportFileName !== undefined) {
    inspection.reportFileName = payload.reportFileName;
  }

  syncListingStatus(database, inspection.listingId);
  writeDatabase(database);

  return delay(normalizeInspection(inspection, database));
}

export async function getAdminOverview() {
  const database = readDatabase();

  return delay({
    users: database.users.map((user) => withoutPassword(user)),
    listings: database.listings.map((listing) => normalizeListing(listing, database)),
    inspections: database.inspections.map((inspection) =>
      normalizeInspection(inspection, database),
    ),
  });
}

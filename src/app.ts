import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Create logs folder
const logDirectory = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Write access logs to logs/access.log
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, "access.log"),
  { flags: "a" }
);

app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("dev"));

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "PrismaDeploy API is running successfully"
  });
});

// Create product
app.post("/products", async (req: Request, res: Response) => {
  try {
    const { name, description, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        error: "Name and price are required"
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price)
      }
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      error: "Failed to create product"
    });
  }
});

// Get all products
app.get("/products", async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: "desc"
      }
    });

    return res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);

    return res.status(500).json({
      error: "Failed to fetch products"
    });
  }
});

// Get one product
app.get("/products/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "Invalid product ID"
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id
      }
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    return res.json(product);
  } catch (error) {
    console.error("Fetch product error:", error);

    return res.status(500).json({
      error: "Failed to fetch product"
    });
  }
});

// Update product
app.put("/products/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "Invalid product ID"
      });
    }

    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        name,
        description,
        price: price !== undefined ? Number(price) : undefined
      }
    });

    return res.json(product);
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      error: "Failed to update product"
    });
  }
});

// Delete product
app.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "Invalid product ID"
      });
    }

    await prisma.product.delete({
      where: {
        id
      }
    });

    return res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      error: "Failed to delete product"
    });
  }
});

export default app;
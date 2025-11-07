import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import MenuItem from '../models/MenuItem';
import RestaurantTable from '../models/RestaurantTable';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

// Menu Item Controllers
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { category, dishType, page = 1, limit = 20, available = true } = req.query;
    
    const filter: any = {};
    if (available === 'true') filter.isAvailable = true;
    if (category) filter.category = category;
    if (dishType) filter.dishType = dishType;

    const menuItems = await MenuItem.find(filter)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .sort({ category: 1, name: 1 });

    const total = await MenuItem.countDocuments(filter);

    res.json({
      menuItems,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Generate unique item ID
    const itemCount = await MenuItem.countDocuments();
    const itemId = `MENU${String(itemCount + 1).padStart(4, '0')}`;

    const menuItemData = {
      ...req.body,
      itemId,
      createdBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error: any) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Menu item already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Restaurant Table Controllers
export const getRestaurantTables = async (req: Request, res: Response) => {
  try {
    const { tableType, capacity, status, available = true } = req.query;
    
    const filter: any = {};
    if (available === 'true') filter.isAvailable = true;
    if (tableType) filter.tableType = tableType;
    if (status) filter.status = status;
    if (capacity) filter.seatingCapacity = { $gte: parseInt(capacity as string) };

    const tables = await RestaurantTable.find(filter).sort({ tableName: 1 });

    res.json({ tables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRestaurantTableById = async (req: Request, res: Response) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRestaurantTable = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Generate unique table ID
    const tableCount = await RestaurantTable.countDocuments();
    const tableId = `TBL${String(tableCount + 1).padStart(3, '0')}`;

    const tableData = {
      ...req.body,
      tableId,
      createdBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const table = new RestaurantTable(tableData);
    await table.save();

    res.status(201).json(table);
  } catch (error: any) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Table ID already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const updateRestaurantTable = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
    };

    const table = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRestaurantTable = async (req: Request, res: Response) => {
  try {
    const table = await RestaurantTable.findByIdAndDelete(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMenuCategories = async (req: Request, res: Response) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

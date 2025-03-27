import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads and processes the Zengadgets JSON file
 * @returns {Object} Object containing both original and processed gadget data
 */
export const processGadgetsData = () => {
  try {
    // Define path to the JSON file
    const filePath = path.join(path.dirname(path.dirname(__dirname)), 'data', 'json', 'Zengadgets.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return { error: 'Gadgets data file not found' };
    }
    
    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Process data similar to new.js
    let resdata = { "gadget-category": [] };
    
    for (let x in data["gadget-categories"]) {
      let tmpJson = {
        category: data["gadget-categories"][x]["category"],
        "gadgets": []
      };
      
      let gadgets = data["gadget-categories"][x]["gadgets"];
      for (let y in gadgets) {
        let gadget = {
          "name": gadgets[y].name
        };
        tmpJson.gadgets.push(gadget);
      }
      
      resdata["gadget-category"].push(tmpJson);
    }
    
    // Return both original and processed data
    return [data, resdata];
  } catch (error) {
    console.error('Error processing gadgets data:', error);
    return { error: error.message };
  }
};
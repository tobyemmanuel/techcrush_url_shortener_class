import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const BASE_URL = "https://example.com"

export async function getExample(){
    const response = await fetch(BASE_URL)

    if (!response.ok) throw new AppError('HTTP Error')
    
    return response
} 

export async function postExample(){

    const response = fetch(BASE_URL,
        {
            method: "POST",
            headers: { Accept: "application/json", api_key: "XXXXXX"},
            body: JSON.stringify({name: Tobi})
        }
    )

    if (!response.ok) throw new AppError('HTTP Error')
    
    return response.body
} 
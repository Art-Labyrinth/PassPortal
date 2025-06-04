import { ID_NUMBER_MIN, ID_NUMBER_MAX } from '../config/constants.js';
import { checkTicketIdExists } from '../db/queries.js';
export function formatTicketId(type, number) {
    const formatted = number.toString();
    const firstPart = formatted.substring(0, 3);
    const secondPart = formatted.substring(3);
    return `${type}-${firstPart}-${secondPart}`;
}
//export function generateId(type : string): string {
//  const minCeiled = Math.ceil(800000);
//  const maxFloored = Math.floor(899999);
//  return `${type}-${Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)}`; // 
//}
export async function generateUniqueTicketId(type) {
    let attempts = 0;
    const maxAttempts = 50;
    while (attempts < maxAttempts) {
        const randomNumber = Math.floor(Math.random() * (ID_NUMBER_MAX - ID_NUMBER_MIN + 1) + ID_NUMBER_MIN);
        const ticketId = formatTicketId(type, randomNumber);
        const exists = await checkTicketIdExists(ticketId);
        if (!exists) {
            return ticketId;
        }
        attempts++;
    }
    throw new Error('Failed to generate a unique ticket ID after multiple attempts');
}
export function validateTicketId(id) {
    // проверк на формат ID: должен быть в формате L-XXX-XXXX, где L принадлежит множеству [G, M, V, O, S, F, C, L]
    const regex = /^[GMVOSFCL]-\d{3}-\d{4}$/;
    if (!regex.test(id)) {
        return false;
    }
    // проверка на диапазон чисел
    const parts = id.split('-');
    const numberPart = parseInt(parts[1] + parts[2], 10);
    if (numberPart < ID_NUMBER_MIN || numberPart > ID_NUMBER_MAX) {
        return false;
    }
    return true;
}
export function parseTicketTypeFromId(id) {
    if (!validateTicketId(id)) {
        return null;
    }
    return id.charAt(0);
}
export default function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    const formattedDate = new Date(date).toLocaleDateString('en-US', options);
    const [month, day, year] = formattedDate.split(' ');
    const monthNames = {
        Jan: 'Jan',
        Feb: 'Feb',
        Mar: 'Mar',
        Apr: 'Apr',
        May: 'May',
        Jun: 'Jun',
        Jul: 'Jul',
        Aug: 'Aug',
        Sep: 'Sep',
        Oct: 'Oct',
        Nov: 'Nov',
        Dec: 'Dec'
    };
    return `${day} ${monthNames[month]} ${year}`;
}

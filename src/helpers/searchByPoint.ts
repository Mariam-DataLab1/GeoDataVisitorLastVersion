
import { searchResourcesDescriptions,searchQuery} from "./sparql"; //runQuery
/**
 * 
 * @param lat 
 * @param lng 
 * @returns 
 */
// export async function getFromCoordinates(lat : string, lng: string) {
//   const results = await runQuery(lat,lng);
//   console.log(await results);
 
// }

/**
 * @param api
 * @returns 
 */

// This function get data  from interface and returns the results
export async function getFromTextSearch(apiAddress: string, username:string, datasetName: string) {
// get the JSON from API
  const results = await searchQuery(username, datasetName);
 return searchResourcesDescriptions(apiAddress, results);
}

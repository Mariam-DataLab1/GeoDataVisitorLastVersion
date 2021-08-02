//@ts-check
import * as wellKnown from "wellknown";// Well-known text (WKT) is a text markup language for representing vector geometry objects.
import * as turf from "@turf/turf";
import _ from "lodash";
//@Select a Sparql query
// export const apiAddress = "https://api.labs.kadaster.nl/queries/jiarong-li/PandviewerTest/run"
// export const apiAddress = "https://api.labs.kadaster.nl/queries/BibiMaryam-SajjadianJaghargh/Geodatabgt/run"
// export const apiAddress = "https://api.labs.kadaster.nl/queries/BibiMaryam-SajjadianJaghargh/Geodatabgttest/run"
// automatically create link data and group them as an object
export interface SparqlResults {
    head: Head;
    results: {
        bindings: Binding[];
    };
}
export interface Head {
    vars: string[];
}
export interface Binding {
    [varname: string]: BindingValue;
}

export type BindingValue =
    | {
        type: "uri";
        value: string;
    }
    | {
        type: number; 
        value: string
    }
    | {
        type: "literal"; 
        value: string
    };


/**
 * Convert the sparql json results of user API into a Result.js array
 */
// new case

export async function searchResourcesDescriptions(apiAddress: string, res:SparqlResults) {
    let propNames = res.head.vars
    return Promise.all(res.results.bindings.map(async b => {
        let geoJson = null
        let properties: any = {}
        for(let prop of propNames) {
            if(prop === 'polygon') {
                geoJson = wellKnown.parse(b[prop].value)
            }
            else if(prop === 'polygonLabel') {
                properties['User Dataset'] = (/ href=\"(?<href>.*)\" /.exec(b[prop].value).groups || {}).href
                
            }
            else if(b[prop].type === 'uri') {
                properties[prop] = b[prop].value
            }
        }
        let coords = turf.center(geoJson).geometry.coordinates
            let data
            try {
                data = await fetch(`${apiAddress}?lat=${coords[0]}&long=${coords[1]}`).then(result => result.json())
                .then(result => result[0])
              
                delete data.bagShape
                delete data.punt
                delete data.BagShape0
                
            } catch (error) {}
            return {
                sub: 'registratie',
                geo: geoJson,
                ...properties,
                ...(data || {})
            };
    }))
}
/**
 * Get the text search result from user's api
 * @param api 
 * @returns 
 */
// new case

export async function searchQuery(username:string, datasetName: string): Promise<SparqlResults> {
    let api = `https://api.data.pldn.nl/datasets/${username}/${datasetName}/services/${datasetName}/sparql`
    const sparqlQuery = `PREFIX sdo: <https://schema.org/>
    PREFIX bag: <https://bag2.basisregistraties.overheid.nl/bag/def/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    Prefix prov: <http://www.w3.org/ns/prov#>
    prefix sdo: <https://schema.org/>
    prefix pldn: <https://data.pldn.nl/4b8917/def/>
    select distinct
    ?polygon  ?straatadres ?BAG2

      (strdt(concat('<a href="https://data.pldn.nl/${username}/${datasetName}/browser?resource=',encode_for_uri(?s),'" target="_link">',str(?s),'</a>'),
             rdf:HTML) as ?polygonLabel)
    {
        ?s
        
        sdo:postalcode ?postcode;
        sdo:address ?Nummeraanduiding. # should be linked users
      service <https://api.labs.kadaster.nl/datasets/kadaster/bag2/services/default/sparql> {
       ?BAG2 foaf:primaryTopic ?Nummeraanduiding.# correct should be linked BAG2
          service <https://api.labs.kadaster.nl/datasets/kadaster/kg/services/default/sparql> {
          
       ?place
         a sdo:Place;
        sdo:address ?postadres;
        sdo:geo ?bagShape .
      ?bagShape
        a sdo:GeoShape;
        sdo:name ?bagShapeNaam;
        sdo:polygon ?polygon .
        filter(?bagShapeNaam in ("BAG geometrie", "BAG vlakgeometrie")). 
      ?postadres
        a sdo:PostalAddress; 
        sdo:streetAddress ?straatadres;
        sdo:postalCode ?postcode;
        prov:wasDerivedFrom ?BAG2.
       }}
    } limit 30`

    //if user refined postalcode = sdo:postalcode ?Nummeraanduiding; for example for postaddreshous dataset
    const result = await fetch(api, {
        method: "POST",
        headers: {
            "Content-Type": "application/sparql-query",
            Accept: "application/sparql-results+json"
        },
        body: sparqlQuery
    });
    if (result.status > 300) {
        throw new Error("Request with response " + result.status);
    }
    return result.json();
}
import {useOntologyStore} from "../../../stores/ontology.ts";

export const GraphExplorer = () => {
    const ontology = useOntologyStore(state => state.ontology);

    return (
        <>Graph Explorer</>
    );
}

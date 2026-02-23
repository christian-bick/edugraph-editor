import {useEffect} from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {useOntologyStore} from "./stores/ontology.ts";
import {Header} from "./components/app/Header/Header.tsx";
import {Content} from "./components/app/Content/Content.tsx";
import {Footer} from "./components/app/Footer/Footer.tsx";
import {GraphExplorer} from "./components/pages/GraphExplorer/GraphExplorer.tsx";

export const App = () => {
    const fetchOntology = useOntologyStore(state => state.fetchOntology);
    const ontology = useOntologyStore(state => state.ontology);

    useEffect(() => {
        if (!ontology) {
            fetchOntology();
        }
    }, [fetchOntology, ontology]);

    return (
        <BrowserRouter>
            <Header/>
            <Content>
                <Routes>
                    <Route index element={<GraphExplorer/>}/>
                </Routes>
            </Content>
            <Footer/>
        </BrowserRouter>
    );
};

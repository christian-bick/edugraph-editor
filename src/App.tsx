import {useEffect} from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {useOntologyStore} from "./stores/ontology-store.ts";
import {Header} from "./components/app/Header/Header.tsx";
import {Content} from "./components/app/Content/Content.tsx";
import {Footer} from "./components/app/Footer/Footer.tsx";
import {GraphExplorer} from "./components/pages/GraphExplorer/GraphExplorer.tsx";
import { useBranchStore } from './stores/branch-store.ts';

export const App = () => {
    const fetchOntology = useOntologyStore(state => state.fetchOntology);
    const { activeBranch, fetchBranches } = useBranchStore();

    // Fetch branches on initial load
    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    // Fetch ontology whenever the active branch changes
    useEffect(() => {
        if (activeBranch) {
            fetchOntology(activeBranch);
        }
    }, [activeBranch, fetchOntology]);

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

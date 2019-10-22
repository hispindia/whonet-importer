import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { App as D2UIApp, mui3theme as dhis2theme } from '@dhis2/d2-ui-core';
import HeaderBar from './components/dhis2/HeaderBar';
import Sidebar from './components/dhis2/Sidebar';
import ImportPreview from './components/dhis2/ImportPreview';


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            d2: props.d2,
            baseURL: props.baseURL,
            importFile: undefined,
            orgUnitId: '',
            orgUnitName: '',
        };
    }

    getChildContext() {
        return { d2: this.state.d2 };
    }


    handleFileUpload = (file) => {
		this.setState({importFile: file})
    }

    
    setOrgUnit = (orgUnitId, orgUnitName) => {
        this.setState({orgUnitId: orgUnitId, orgUnitName: orgUnitName})
    }
    

    render() {
        if (!this.state.d2) {
            console.log('no');
            return null;
        }

        return (
            <D2UIApp>
                <MuiThemeProvider theme={createMuiTheme(dhis2theme)}>
                    <HeaderBar appName='Whonet Importer'/> 
                    <Sidebar handleFileUpload={this.handleFileUpload} d2={this.state.d2} setOrgUnit={this.setOrgUnit}/>
                    <ImportPreview importFile={this.importFile} orgUnitId={this.state.orgUnitId} orgUnitName={this.state.orgUnitName} />
                </MuiThemeProvider>
            </D2UIApp>
        );
    }
}

App.childContextTypes = {
    d2: PropTypes.object,
};

App.propTypes = {
    d2: PropTypes.object.isRequired,
};
export default App;

import React from 'react';
import Elements from './multiple-lab/Elements';
import Attributes from './multiple-lab/Attributes';
import Options from './multiple-lab/Options';
import DataElementsTable from './DataElementsTable';
import AttributesTable from './AttributesTable';
import { TabBar, Tab } from '@dhis2/ui-core';
class SettingTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          selectedTab   : '',
        };
      }

    render(){
        let orgUnitId = this.props.orgUnitId;
        let orgUnitName = this.props.orgUnitName;
        let elements, attributes, options;
      
        let selectedElement = '';
        switch (this.state.selectedTab) {
            case '':
                if (this.props.settingType === 'multiLab') {
                    selectedElement = <Elements orgUnitId={orgUnitId} orgUnitName={orgUnitName}/>;  
                    this.setState({selectedTab: 'elements'})                
                }
                else {
                    selectedElement = <DataElementsTable />;
                    this.setState({selectedTab: 'dataElementsTable'});
                }
            break; 
            case 'elements':
                selectedElement = <Elements orgUnitId={orgUnitId} orgUnitName={orgUnitName}/>;
            break;
            case 'attributes':
                selectedElement = <Attributes orgUnitId={orgUnitId} orgUnitName={orgUnitName}/>;
            break; 
            case 'options':
                selectedElement = <Options orgUnitId={orgUnitId} orgUnitName={orgUnitName}/>;
            break; 
            case 'dataElementsTable':
                selectedElement = <DataElementsTable />;
            break; 
            case 'attributesTable':
                selectedElement = <AttributesTable />;
        }

        if (this.props.settingType === 'multiLab') {
            return (
                <div>
                    <TabBar>
                        <Tab selected={this.state.selectedTab==='elements'} onClick={()=>this.setState({selectedTab: 'elements'})} > Elements </Tab>
                        <Tab selected={this.state.selectedTab==='attributes'} onClick={()=>this.setState({selectedTab: 'attributes'})} > Attributes </Tab>
                        <Tab selected={this.state.selectedTab==='options'} onClick={()=>this.setState({selectedTab: 'options'})} > Options </Tab>
                    </TabBar>
                    {selectedElement}
                </div>
            )
        }
        else {
            return (
                <div>
                    <TabBar>
                        <Tab selected={this.state.selectedTab==='dataElementsTable'} onClick={()=>this.setState({selectedTab: 'dataElementsTable'})} > Elements </Tab>
                        <Tab selected={this.state.selectedTab==='attributesTable'} onClick={()=>this.setState({selectedTab: 'attributesTable'})} > Attributes </Tab>
                    </TabBar>
                    {selectedElement}
                </div>
            )
        }
    }
    
}

export default SettingTab;
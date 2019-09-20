import React from 'react';
import Elements from './multiple-lab/Elements';
import Attributes from './multiple-lab/Attributes';
import Options from './multiple-lab/Options';
import DataElementsTable from './DataElementsTable';
import AttributesTable from './AttributesTable';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Close from '@material-ui/icons/Close';
import * as styleProps  from '../ui/Styles';
import { Card, Modal, Button, ButtonStrip, TabBar, Tab  } from '@dhis2/ui-core';


class MappingModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: props.isModalOpen,
      title: '',
      selectedTab: '',
      child: React.createRef(),
    }; 
  }
  

  componentDidMount() {
    if (this.props.settingType === 'multiLab') {
      this.setState({
        title: 'Change mapping settings for org. unit: ' + this.props.orgUnitName,
        selectedTab: 'elements'})
    }
    else {
      this.setState({
        title: 'Change general mapping settings',
        selectedTab: 'dataElementsTable'})
    }
  }


  render() {
    let tabBar;
    if (this.props.settingType === 'multiLab') {
      tabBar = 
      <TabBar>
        <Tab selected={this.state.selectedTab==='elements'} onClick={()=>this.setState({selectedTab: 'elements'})} > Elements </Tab>
        <Tab selected={this.state.selectedTab==='attributes'} onClick={()=>this.setState({selectedTab: 'attributes'})} > Attributes </Tab>
        <Tab selected={this.state.selectedTab==='options'} onClick={()=>this.setState({selectedTab: 'options'})} > Options </Tab>
    </TabBar>
    }
    else {
      tabBar = 
      <TabBar>
        <Tab selected={this.state.selectedTab==='dataElementsTable'} onClick={()=>this.setState({selectedTab: 'dataElementsTable'})} > Elements </Tab>
        <Tab selected={this.state.selectedTab==='attributesTable'} onClick={()=>this.setState({selectedTab: 'attributesTable'})} > Attributes </Tab>
    </TabBar>
    }
    let mappingTable;
    switch (this.state.selectedTab) {
      case 'elements':
        mappingTable = <Elements ref={this.state.child} orgUnitId={this.props.orgUnitId} orgUnitName={this.props.orgUnitName}/>;
      break;
      case 'attributes':
        mappingTable = <Attributes ref={this.state.child} orgUnitId={this.props.orgUnitId} orgUnitName={this.props.orgUnitName}/>;
      break; 
      case 'options':
        mappingTable = <Options ref={this.state.child} orgUnitId={this.props.orgUnitId} orgUnitName={this.props.orgUnitName}/>;
      break; 
      case 'dataElementsTable':
        mappingTable = <DataElementsTable ref={this.state.child} />;
      break; 
      case 'attributesTable':
        mappingTable = <AttributesTable ref={this.state.child} />;
    }
    
  
    return (
      <div>
        <Modal large open={this.state.open} onClose={this.handleClose}>
          <Modal.Title>
            {this.state.title} 
            {tabBar}         
          </Modal.Title>
          <Modal.Content>
            {mappingTable}
            {/*<Tabs settingType={this.props.settingType} orgUnitId={orgUnitId} orgUnitName={orgUnitName}/>*/}
          </Modal.Content>
          <Modal.Actions>
            <ButtonStrip>
              <Button type="button" onClick={this.props.handleModal}>Close</Button>
              <Button primary onClick={()=>this.state.child.current.saveMapping()}>Save</Button>
            </ButtonStrip>
          </Modal.Actions>    
        </Modal>
      </div>
    );
  }
}


MappingModal.propTypes = {
  classes: PropTypes.object.isRequired,
};

// We need an intermediary variable for handling the recursive nesting.
const MappingModalWrapped = withStyles(styleProps.styles)(MappingModal);

export default MappingModalWrapped;
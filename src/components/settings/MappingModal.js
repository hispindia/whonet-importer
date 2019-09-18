import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
//import Modal from '@material-ui/core/Modal';
//import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import Tabs from './SettingTab';
import Close from '@material-ui/icons/Close';
import * as styleProps  from '../ui/Styles';
import { Card, Modal, Button } from '@dhis2/ui-core';

class MappingModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: props.isModalOpen,
    };    
  }  

  render() {
    let orgUnitId = this.props.orgUnitId;
    let orgUnitName = this.props.orgUnitName;
    let modalTitle;
    if (this.props.settingType === 'multiLab') {
      modalTitle = <h3 style={styleProps.styles.cardHeaderModal}> Change mapping settings for org. unit: {orgUnitName} <br /> Org. Unit Code: {orgUnitId}</h3>;
    } else {
      modalTitle = <h3 style={styleProps.styles.cardHeaderModal}> Change general mapping settings <br /></h3>;
    }
    return (
      <div>
        <Modal large open={this.state.open} onClose={this.handleClose}>
          <Modal.Content>
                {modalTitle}
                <Tabs settingType={this.props.settingType} orgUnitId={orgUnitId} orgUnitName={orgUnitName}/>
          </Modal.Content>
          <Modal.Actions>
            <Button type="button" onClick={this.props.handleModal}>Cancel</Button>
            <Button primary>Put save button here</Button>
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
import React from 'react';
import CardText from 'material-ui/Card/CardText';
import * as styleProps  from '../ui/Styles';
import * as config  from '../../config/Config';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Card, Modal, Button, ButtonStrip, TabBar, Tab  } from '@dhis2/ui-core';

import { 
    getDataStoreNameSpace,
} from '../api/API';
export default class RequiredColumns extends React.Component {
  constructor(props) {
    super(props);
    this.state = {  
      dsNamespaceElements: [],
      dsNamespaceAttributes: [],
      dsNamespaceOptions: [],
      open: props.isModalOpen,
      dsNameSpace: [],
    }  
  }      
  async componentWillMount(){
    let dsNameSpace = []; 
    await getDataStoreNameSpace(this.props.orgUnitId).then((response) => {
      this.state.dsNameSpace.push(response.data.elements);
      this.state.dsNameSpace.push(response.data.attributes);
      this.state.dsNameSpace.push(response.data.options);
      this.setState({
        dsNamespaceElements  : response.data.elements,      
        dsNamespaceAttributes: response.data.attributes,      
        dsNamespaceOptions   :  response.data.options      
      }); 
    }).catch(error => this.setState({error: true}));

  }
  handleModal = () =>{
    this.setState({
      open:false
    });
  }
	render () {
    const classes = this.props;
    /*
    * data - contains the user selected file
    * 
    */
    let whonetData = Object.entries(this.props.csvData);
    const {dsNameSpace} = this.state;

    let matchedColumns; 
    let dataValues = whonetData.map( (value, key) =>{

        matchedColumns = this.state.dsNameSpace.map( (data, index ) =>{
          return data.map( (info, i) => {
            if (info.mapCode === value[0]) 
              return info.mapCode;                
          } )        

        }) 

        if (matchedColumns == "") {
          matchedColumns = "Mapping missing";
        }
      return (
        <TableRow key={key}>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
            {key+1}
          </TableCell>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
            {value[0]}
          </TableCell>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
            <p style={styleProps.styles.colors.color2}> {matchedColumns} </p>
          </TableCell>
        </TableRow>
      )
    });

		return (
      <div>
      <Modal large open={this.state.open} onClickk={this.handleClose}>
          <Modal.Title>
            <h3>Required columns </h3>       
          </Modal.Title>
          <Modal.Content>             
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell style={styleProps.styles.tableHeader}> 
                    <strong><h3>S/N </h3></strong>
                  </TableCell>
                  <TableCell style={styleProps.styles.tableHeader}> 
                    <strong><h3> WHONET selected file columns </h3></strong>
                  </TableCell>
                  <TableCell style={styleProps.styles.tableHeader}> 
                    <strong><h3> DHIS2 mapping columns </h3></strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>            
                {dataValues}        
              </TableBody>          
            </Table> 
          </Modal.Content>
          <Modal.Actions>
            <ButtonStrip>
              <Button type="button" onClick={()=> this.handleModal()}>Close</Button>              
            </ButtonStrip>
          </Modal.Actions>  
        </Modal>
      </div>
		);
	}
}

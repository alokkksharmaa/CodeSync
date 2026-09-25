import { LigthningElement} from 'lwc'

export default class demo2 LigthningElement{ 

    text = '';
    handleChange(event){
      this.text = event.target.value;
    }
 
     

    </template>
}
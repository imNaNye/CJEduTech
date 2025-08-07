import '../../components/user/discussionResult/discussionResult.css'

import DiscussionResultMain from '../../components/user/discussionResult/DiscussionResultMain';
import PageHeader from '../../components/common/PageHeader';

export default function DiscussionResultPage(){
    return (
        <div className = "discussion-result-page">
            <PageHeader/>
            <DiscussionResultMain/>
        </div>
    );
}
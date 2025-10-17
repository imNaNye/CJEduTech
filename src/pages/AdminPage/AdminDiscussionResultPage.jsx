import '../../components/user/discussionResult/discussionResult.css'

import DiscussionResultMain from '../../components/user/discussionResult/DiscussionResultMain';
import PageHeader from '../../components/common/PageHeader';

import { useRoundStep } from '@/contexts/RoundStepContext';

export default function DiscussionResultPage(){

        const { round, setRound, step, setStep } = useRoundStep();

    return (
        <div className = "discussion-result-page">
            <PageHeader title={"Round"+round+" 토론 결과"} />
            <DiscussionResultMain/>
        </div>
    );
}